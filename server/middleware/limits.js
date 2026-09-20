import { rateLimit } from "express-rate-limit";

const options = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please retry shortly.",
  },
};

export const authLimiter = rateLimit({
  ...options,
  limit: 12,

  // E2E bypass is allowed only outside production.
  skip: () =>
    process.env.NODE_ENV !== "production" &&
    process.env.E2E_TEST === "true",
});

export const paymentLimiter = rateLimit({
  ...options,
  limit: 30,
});