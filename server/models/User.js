import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home", trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: "", trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["customer", "vendor", "admin"], default: "customer" },
    avatar: { type: String, default: "" },
    addresses: { type: [addressSchema], default: [] },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    refreshTokenHash: { type: String, default: null, select: false },
    refreshTokenExpires: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
