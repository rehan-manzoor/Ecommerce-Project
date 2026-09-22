import connectDB from "./config/db.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/userRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import vendorAnalyticsRoutes from "./routes/vendorAnalyticsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import shippingRoutes from "./routes/shippingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";

import { stripeWebhook } from "./controllers/paymentController.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

app.use(async (req, res, next) => {
  try {
    if (
      process.env.NODE_ENV === "test" ||
      req.path === "/api/health"
    ) {
      return next();
    }

    await connectDB();
    next();
  } catch (error) {
    console.error(
      "Database connection failed:",
      error.message
    );

    return res.status(503).json({
      success: false,
      message: "Database connection unavailable",
      data: null,
      error: null,
    });
  }
});

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: (
      process.env.CLIENT_URL ||
      "http://localhost:5173"
    )
      .split(",")
      .map((url) => url.trim()),
    credentials: true,
  })
);

/*
 * Stripe webhook must receive the raw request body.
 * Keep this route before express.json().
 */
app.post(
  "/api/payments/webhook",
  express.raw({
    type: "application/json",
  }),
  stripeWebhook
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(cookieParser());

app.get("/api/health", (_req, res) =>
  res.json({
    success: true,
    message: "OK",
    data: null,
    error: null,
  })
);

app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use(
  "/api/vendor/analytics",
  vendorAnalyticsRoutes
);
app.use("/api/uploads", uploadRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/shipping", shippingRoutes);
app.use(
  "/api/notifications",
  notificationRoutes
);
app.use("/api/returns", returnRoutes);

app.use((_req, res) =>
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
);

app.use(errorHandler);

export default app;