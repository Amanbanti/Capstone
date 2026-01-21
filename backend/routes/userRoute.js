import express from "express";
import {
  authUser,
  registerUser,
  logoutUser,
  updateUserProfile,
  getUserById,
  getAllUsers,
  deleteUser,
  updateUserRole,
  checkAuth,
  updatePassword,
} from "../controllers/userController.js";

import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/check-auth", checkAuth); // Endpoint to check authentication status

router.get("/", protect, admin, getAllUsers);
router.get("/:id", protect, admin, getUserById);
router.post("/", registerUser);
router.post("/logout", logoutUser);
router.post("/login", authUser);

export default router;
