import express from "express";
import { getAllOrders, updateOrderStatus } from "../controllers/orderController.js";
import {
  getOverview,
  getSalesOverTime,
  getTopProducts,
  getTopVendors,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
const router = express.Router();
router.use(protect, authorize("admin"));
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.get("/analytics/overview", getOverview);
router.get("/analytics/sales-over-time", getSalesOverTime);
router.get("/analytics/top-products", getTopProducts);
router.get("/analytics/top-vendors", getTopVendors);
export default router;
