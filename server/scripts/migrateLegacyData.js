import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import { uniqueSlug } from "../utils/slugify.js";

await connectDB();
for (const category of await Category.find({ $or: [{ slug: { $exists: false } }, { slug: "" }] })) {
  category.slug = uniqueSlug(category.name);
  await category.save();
}
for (const vendor of await Vendor.find()) {
  const user = await User.findById(vendor.user);
  if (!vendor.storeSlug) vendor.storeSlug = uniqueSlug(vendor.storeName);
  if (!vendor.status) vendor.status = user?.role === "vendor" ? "approved" : "pending";
  vendor.approved = vendor.status === "approved";
  await vendor.save();
}
for (const product of await Product.find()) {
  if (!product.slug) product.slug = uniqueSlug(product.name);
  if (!product.approvalStatus) product.approvalStatus = "approved";
  if (!product.status || product.status === "draft") product.status = "active";
  await product.save();
}
console.log("Legacy data migration complete.");
await mongoose.disconnect();
