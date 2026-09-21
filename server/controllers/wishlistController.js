import mongoose from "mongoose";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
const populate = (id) =>
  Wishlist.findOne({ user: id }).populate({
    path: "products",
    match: { status: "active", approvalStatus: "approved" },
    populate: { path: "vendor", select: "storeName storeSlug" },
  });
export const getWishlist = async (req, res) =>
  res.json({ success: true, data: (await populate(req.user.userId))?.products || [] });
export const addWishlist = async (req, res) => {
  const id = req.params.productId;
  if (
    !mongoose.isValidObjectId(id) ||
    !(await Product.exists({ _id: id, status: "active", approvalStatus: "approved" }))
  )
    return res.status(404).json({ success: false, message: "Product unavailable" });
  await Wishlist.updateOne(
    { user: req.user.userId },
    { $addToSet: { products: id } },
    { upsert: true }
  );
  res.json({ success: true, data: (await populate(req.user.userId))?.products || [] });
};
export const removeWishlist = async (req, res) => {
  await Wishlist.updateOne(
    { user: req.user.userId },
    { $pull: { products: req.params.productId } }
  );
  res.json({ success: true, data: (await populate(req.user.userId))?.products || [] });
};
