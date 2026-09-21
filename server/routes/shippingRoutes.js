import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  listShipping,
  listAllShipping,
  createShipping,
  updateShipping,
} from "../controllers/shippingController.js";
const router = Router();
router.get("/", listShipping);
router.get("/admin", protect, authorize("admin"), listAllShipping);
router.post("/", protect, authorize("admin"), createShipping);
router.put("/:id", protect, authorize("admin"), updateShipping);
export default router;
