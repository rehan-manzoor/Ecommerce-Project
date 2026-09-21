import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    brand: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    sku: { type: String, default: "", trim: true },
    salePrice: { type: Number, min: 0, default: null },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    tags: { type: [String], default: [] },
    specifications: { type: Map, of: String, default: {} },
    featured: { type: Boolean, default: false },
    variants: [
      {
        attributes: { type: Map, of: String, required: true },
        sku: { type: String, required: true },
        price: { type: Number, min: 0, required: true },
        stock: { type: Number, min: 0, required: true },
      },
    ],
    images: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "active", "inactive"], default: "active" },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ vendor: 1, approvalStatus: 1, status: 1 });
productSchema.index({ category: 1, price: 1 });

export default mongoose.model("Product", productSchema);
