import * as authService from "../services/authService.js";

/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints
 */

/**
 * POST /api/auth/signup
 * Register a new user
 */
export const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, shift } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["email", "password", "firstName", "lastName", "role"],
      });
    }

    if (!["doctor", "nurse", "admin"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role",
        allowed: ["doctor", "nurse", "admin"],
      });
    }

    const result = await authService.signup({
      email,
      password,
      firstName,
      lastName,
      role,
      shift,
    });

    res.status(201).json({
      message: "User registered successfully",
      ...result,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/auth/login
 * Login existing user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const result = await authService.login({ email, password });

    res.status(200).json({
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: error.message });
  }
};

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const result = await authService.refreshAccessToken(refreshToken);

    res.status(200).json({
      message: "Token refreshed successfully",
      ...result,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(401).json({ error: error.message });
  }
};

/**
 * POST /api/auth/logout
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    await authService.logout(userId, refreshToken);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/auth/me
 * Get current user details
 */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await authService.getCurrentUser(userId);

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/auth/create-nurse
 * Create a new nurse (doctor only)
 */
export const createNurse = async (req, res) => {
  try {
    const { email, password, firstName, lastName, shift } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !shift) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["email", "password", "firstName", "lastName", "shift"],
      });
    }

    if (!["day", "night"].includes(shift)) {
      return res.status(400).json({
        error: "Invalid shift",
        allowed: ["day", "night"],
      });
    }

    const result = await authService.signup({
      email,
      password,
      firstName,
      lastName,
      role: "nurse",
      shift,
    });

    // Don't return tokens for nurse creation
    res.status(201).json({
      message: "Nurse created successfully",
      user: result.user,
    });
  } catch (error) {
    console.error("Create nurse error:", error);
    res.status(400).json({ error: error.message });
  }
};
