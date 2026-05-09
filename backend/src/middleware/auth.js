import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Authentication Middleware
 * Verifies JWT tokens and enforces role-based access control
 */

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(401).json({ error: "Invalid token" });
    }

    // Find user
    const user = await User.findById(decoded.userId).select(
      "-password -refreshTokens"
    );
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      shift: user.shift,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Require specific role(s)
 * Usage: requireRole('doctor') or requireRole(['doctor', 'admin'])
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const roles = allowedRoles.flat(); // Handle both single role and array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        message: `This action requires one of the following roles: ${roles.join(
          ", "
        )}`,
      });
    }

    next();
  };
};

/**
 * Require doctor role
 */
export const requireDoctor = requireRole("doctor");

/**
 * Require nurse role
 */
export const requireNurse = requireRole("nurse");

/**
 * Require admin role
 */
export const requireAdmin = requireRole("admin");

/**
 * Require doctor or admin
 */
export const requireDoctorOrAdmin = requireRole(["doctor", "admin"]);
