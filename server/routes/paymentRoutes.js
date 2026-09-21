import express from "express";

import { validate } from "../middleware/validate.js";
import { intentSchema } from "../validators/marketplaceValidator.js";

import {
  createPaymentIntent,
  getPayment,
  getPaymentByIntent,
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { paymentLimiter } from "../middleware/limits.js";

const router = express.Router();

router.post("/create-intent", protect, paymentLimiter, validate(intentSchema), createPaymentIntent);

router.get("/intent/:paymentIntentId", protect, getPaymentByIntent);

router.get("/:id", protect, getPayment);

export default router;
