import express from "express";
import * as authController from "../controllers/authController.js";
import { authenticate, requireDoctor } from "../middleware/auth.js";

const router = express.Router();

/**
 * Auth Routes
 * All authentication-related endpoints
 */

// Public routes
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getCurrentUser);
router.post(
  "/create-nurse",
  authenticate,
  requireDoctor,
  authController.createNurse
);

export default router;
