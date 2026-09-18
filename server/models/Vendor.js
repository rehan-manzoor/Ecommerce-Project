import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    storeName: { type: String, required: true, trim: true },
    storeSlug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    description: { type: String, default: "", trim: true },
    logo: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    approved: { type: Boolean, default: false },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
