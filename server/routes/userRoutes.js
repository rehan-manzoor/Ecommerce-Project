import express from "express";
import {
  createUser, loginUser, getMe, updateMe, addAddress, deleteAddress,
  forgotPassword, resetPassword, getUsers, updateUserRole, toggleUserBlock,
  refreshLogin, logoutUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { authLimiter } from "../middleware/limits.js";

const router = express.Router();
router.post("/", authLimiter, createUser);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.post("/refresh", authLimiter, refreshLogin);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.put("/me", protect, updateMe);
router.post("/me/addresses", protect, addAddress);
router.delete("/me/addresses/:id", protect, deleteAddress);
router.get("/", protect, authorize("admin"), getUsers);
router.put("/:id/role", protect, authorize("admin"), updateUserRole);
router.put("/:id/block", protect, authorize("admin"), toggleUserBlock);
export default router;
