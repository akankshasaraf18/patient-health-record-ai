import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't return password hash in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ["doctor", "nurse", "admin"],
        message: "{VALUE} is not a valid role",
      },
      required: [true, "Role is required"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    shift: {
      type: String,
      enum: {
        values: ["day", "night", null],
        message: "{VALUE} is not a valid shift",
      },
      default: null,
      validate: {
        validator: function (value) {
          // Only nurses can have a shift
          if (this.role === "nurse") {
            return value === "day" || value === "night";
          }
          // Non-nurses should have null shift
          return value === null;
        },
        message: "Shift assignment is only valid for nurses",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    refreshTokens: [
      {
        token: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: Date,
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ role: 1, shift: 1 });

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    this.password = await bcrypt.hash(this.password, rounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Method to update last seen
UserSchema.methods.updateLastSeen = async function () {
  this.lastSeen = new Date();
  return await this.save();
};

// Method to add refresh token
UserSchema.methods.addRefreshToken = async function (token) {
  // Default to 7 days expiry (same as JWT_REFRESH_EXPIRY)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  this.refreshTokens.push({
    token,
    expiresAt,
  });

  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }

  return await this.save();
};

// Method to remove refresh token
UserSchema.methods.removeRefreshToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.token !== token);
  return await this.save();
};

// Method to clear all refresh tokens (logout all devices)
UserSchema.methods.clearRefreshTokens = async function () {
  this.refreshTokens = [];
  return await this.save();
};

// Clean up expired refresh tokens
UserSchema.methods.cleanExpiredTokens = async function () {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter((rt) => rt.expiresAt > now);
  return await this.save();
};

export default mongoose.model("User", UserSchema);
