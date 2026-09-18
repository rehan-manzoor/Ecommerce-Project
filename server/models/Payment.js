import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    stripePaymentIntentId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, lowercase: true },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    subtotalAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    shippingAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingMethod: { type: mongoose.Schema.Types.ObjectId, ref: "ShippingMethod", default: null },
    cartSnapshot: { type: [{ product: mongoose.Schema.Types.ObjectId, variantId: mongoose.Schema.Types.ObjectId, quantity: Number, price: Number }], default: [] },
    refunds: [{ stripeRefundId: String, amount: Number, reason: String, status: String, createdAt: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
