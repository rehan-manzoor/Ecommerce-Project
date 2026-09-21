import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { listNotifications, readNotification } from "../controllers/notificationController.js";
const router = Router();
router.use(protect);
router.get("/", listNotifications);
router.put("/:id/read", readNotification);
export default router;
