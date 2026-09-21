import { validate } from "../middleware/validate.js";
import { orderSchema } from "../validators/marketplaceValidator.js";
import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getVendorOrders,
  updateOrderStatus,
  updateVendorOrderStatus,
  cancelVendorOrder,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
const router = express.Router();
router.post("/", protect, validate(orderSchema), createOrder);
router.get("/my", protect, getMyOrders);
router.get("/admin/all", protect, authorize("admin"), getAllOrders);
router.get("/vendor/mine", protect, authorize("vendor"), getVendorOrders);
router.put("/vendor/:id/status", protect, authorize("vendor"), updateVendorOrderStatus);
router.post("/:id/vendors/:vendorId/cancel", protect, cancelVendorOrder);
router.put("/:id/status", protect, authorize("admin"), updateOrderStatus);
router.get("/:id", protect, getOrderById);
export default router;
