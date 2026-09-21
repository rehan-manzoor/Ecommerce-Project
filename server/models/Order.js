import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    variantAttributes: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
    },
    items: { type: [orderItemSchema], required: true },
    subtotalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    shippingMethod: { type: mongoose.Schema.Types.ObjectId, ref: "ShippingMethod", default: null },
    vendorOrders: [
      {
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
        items: { type: [orderItemSchema], default: [] },
        subtotal: { type: Number, min: 0, required: true },
        status: {
          type: String,
          enum: [
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "return_requested",
            "returned",
            "refunded",
          ],
          default: "confirmed",
        },
        carrier: { type: String, default: "" },
        trackingNumber: { type: String, default: "" },
        shippedAt: Date,
        deliveredAt: Date,
        cancellationReason: { type: String, default: "" },
        history: [{ status: String, changedAt: { type: Date, default: Date.now } }],
      },
    ],
    couponCode: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    statusHistory: {
      type: [{ status: String, changedAt: { type: Date, default: Date.now }, note: String }],
      default: [],
    },
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1 });
orderSchema.index({ "vendorOrders.vendor": 1 });

export default mongoose.model("Order", orderSchema);
