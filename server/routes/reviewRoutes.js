import express from "express";
import {
  createReview,
  getProductReviews,
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
const router = express.Router();
router.post("/", protect, createReview);
router.get("/product/:productId", getProductReviews);
router.get("/admin/all", protect, authorize("admin"), getAllReviews);
router.put("/:id/approve", protect, authorize("admin"), approveReview);
router.put("/:id/reject", protect, authorize("admin"), rejectReview);
router.delete("/:id", protect, deleteReview);
export default router;
