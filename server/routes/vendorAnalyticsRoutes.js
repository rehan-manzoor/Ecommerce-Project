import express from "express";
import {
  getVendorOverview,
  getVendorSales,
  getVendorTopProducts,
} from "../controllers/vendorAnalyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
const router = express.Router();
router.use(protect, authorize("vendor"));
router.get("/overview", getVendorOverview);
router.get("/sales-over-time", getVendorSales);
router.get("/top-products", getVendorTopProducts);
export default router;
