import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { uploadImage } from "../controllers/uploadController.js";
const router = express.Router();
router.post("/", protect, authorize("vendor", "admin"), upload.single("image"), uploadImage);
export default router;
