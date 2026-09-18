import express from "express";
import {
  createVendor, getMyVendor, updateMyVendor, getVendors, updateVendorStatus, getPublicVendor,
} from "../controllers/vendorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();
router.post("/", protect, createVendor);
router.get("/me", protect, getMyVendor);
router.put("/me", protect, updateMyVendor);
router.get("/", protect, authorize("admin"), getVendors);
router.put("/:id/status", protect, authorize("admin"), updateVendorStatus);
router.get("/:slug/public", getPublicVendor);
export default router;
