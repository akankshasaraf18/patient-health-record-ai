import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Authentication Service
 * Handles user signup, login, token generation, and refresh logic
 */

// Generate JWT access token (15 minutes)
const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "15m",
  });
};

// Generate refresh token (7 days)
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
  });
};

/**
 * Register a new user (doctor, nurse, or admin)
 */
export const signup = async ({
  email,
  password,
  firstName,
  lastName,
  role,
  shift,
}) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Validate nurse shift
  if (role === "nurse" && !shift) {
    throw new Error("Nurses must have a shift assigned (day or night)");
  }

  if (role === "nurse" && !["day", "night"].includes(shift)) {
    throw new Error('Invalid shift. Must be "day" or "night"');
  }

  // Create new user
  const user = new User({
    email: email.toLowerCase(),
    password, // Will be hashed by pre-save hook
    firstName,
    lastName,
    role,
    shift: role === "nurse" ? shift : undefined,
  });

  await user.save();

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  await user.addRefreshToken(refreshToken);

  return {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      shift: user.shift,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Login existing user
 */
export const login = async ({ email, password }) => {
  // Find user (include password field for comparison)
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Update last seen
  await user.updateLastSeen();

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token
  await user.addRefreshToken(refreshToken);

  return {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      shift: user.shift,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }

  // Find user and check if refresh token exists
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.refreshTokens.includes(refreshToken)) {
    throw new Error("Refresh token not found or already used");
  }

  // Generate new access token
  const accessToken = generateAccessToken(user._id, user.role);

  return {
    accessToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      shift: user.shift,
    },
  };
};

/**
 * Logout user (remove refresh token)
 */
export const logout = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  await user.removeRefreshToken(refreshToken);

  return { message: "Logged out successfully" };
};

/**
 * Get current user details
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password -refreshTokens");
  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    shift: user.shift,
    lastSeen: user.lastSeen,
  };
};
