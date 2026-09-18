import { validate } from "../middleware/validate.js";
import { intentSchema } from "../validators/marketplaceValidator.js";import express from "express";
import { createPaymentIntent, getPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { paymentLimiter } from "../middleware/limits.js";
const router = express.Router();
router.post("/create-intent", protect, paymentLimiter, validate(intentSchema), createPaymentIntent);
router.get("/:id", protect, getPayment);
export default router;
