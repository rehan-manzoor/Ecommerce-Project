import mongoose from "mongoose";
import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import { uniqueSlug } from "../utils/slugify.js";
import Notification from "../models/Notification.js";

const vendorForUser = (userId) => Vendor.findOne({ user: userId });

export const createProduct = async (req, res, next) => {
  try {
    const vendor = await vendorForUser(req.user.userId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor profile not found", data: null, error: null });
    if (vendor.status !== "approved" || vendor.approved !== true) {
      return res.status(403).json({ success: false, message: "Your vendor account is pending admin approval", data: null, error: null });
    }

    const { name, category, description = "", brand = "", price, stock, images = [], status = "active", variants = [], tags = [], sku = "", salePrice = null, lowStockThreshold = 5, specifications = {} } = req.body;
    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ success: false, message: "Name, category, price and stock are required", data: null, error: null });
    }

    const product = await Product.create({
      vendor: vendor._id,
      category,
      name: name.trim(),
      slug: uniqueSlug(name),
      description,
      brand,
      price: Number(price),
      stock: Number(stock),
      sku, salePrice, lowStockThreshold, tags, specifications, variants,
      images,
      status,
      approvalStatus: "pending",
    });
    res.status(201).json({ success: true, message: "Product created and sent for admin approval", data: product, error: null });
  } catch (error) {
    error.statusCode = 400;
    error.publicMessage = "Failed to create product";
    next(error);
  }
};

export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
    const filter = { status: "active", approvalStatus: "approved" };

    if (req.query.category && mongoose.isValidObjectId(req.query.category)) filter.category = req.query.category;
    if (req.query.vendor && mongoose.isValidObjectId(req.query.vendor)) filter.vendor = req.query.vendor;
    if (req.query.brand) filter.brand = String(req.query.brand).slice(0, 80);
    if (req.query.availability === "in_stock") filter.$and = [{ $or: [{ stock: { $gt: 0 } }, { variants: { $elemMatch: { stock: { $gt: 0 } } } }] }];
    if (req.query.minRating) filter.ratingsAverage = { $gte: Number(req.query.minRating) };
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }
    if (req.query.search?.trim()) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { brand: { $regex: escaped, $options: "i" } },
      ];
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { ratingsAverage: -1, numReviews: -1 },
      oldest: { createdAt: 1 },
      newest: { createdAt: -1 },
    };
    const sort = sortMap[req.query.sort] || sortMap.newest;

    const totalResults = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("vendor", "storeName storeSlug logo")
      .populate("category", "name slug")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: products,
      pagination: { page, limit, totalPages: Math.ceil(totalResults / limit), totalResults },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, status: "active", approvalStatus: "approved" })
      .populate("vendor", "storeName storeSlug logo")
      .populate("category", "name slug");
    if (!product) return res.status(404).json({ success: false, message: "Product not found", data: null, error: null });
    res.json({ success: true, message: "Product fetched successfully", data: product, error: null });
  } catch (error) {
    error.statusCode = 400;
    error.publicMessage = "Failed to fetch product";
    next(error);
  }
};

export const getMyProducts = async (req, res, next) => {
  try {
    const vendor = await vendorForUser(req.user.userId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor profile not found", data: null, error: null });
    const products = await Product.find({ vendor: vendor._id }).populate("category", "name slug").sort({ createdAt: -1 });
    res.json({ success: true, message: "Vendor products fetched", data: products, error: null });
  } catch (error) {
    next(error); 
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const vendor = await vendorForUser(req.user.userId);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor profile not found", data: null, error: null });
    const allowed = ["name", "description", "brand", "price", "stock", "category", "images", "status", "sku", "salePrice", "lowStockThreshold", "tags", "specifications", "variants"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.name) updates.slug = uniqueSlug(updates.name);
    if (["name", "description", "brand", "price", "category", "images", "variants", "salePrice", "specifications"].some((key) => key in updates)) updates.approvalStatus = "pending";
    const product = await Product.findOneAndUpdate({ _id: req.params.id, vendor: vendor._id }, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found or not yours", data: null, error: null });
    res.json({ success: true, message: updates.approvalStatus ? "Product updated and sent for approval" : "Product updated", data: product, error: null });
  } catch (error) {
    error.statusCode = 400;
    error.publicMessage = "Failed to update product";
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const vendor = await vendorForUser(req.user.userId);
    const product = await Product.findOneAndUpdate({ _id: req.params.id, vendor: vendor?._id }, { status: "inactive" }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found or not yours", data: null, error: null });
    res.json({ success: true, message: "Product deleted", data: product, error: null });
  } catch (error) {
    next(error);
  }
};

export const getProductsForAdmin = async (req, res, next) => {
  try {
    const filter = req.query.approvalStatus ? { approvalStatus: req.query.approvalStatus } : {};
    const products = await Product.find(filter).populate("vendor", "storeName storeSlug").populate("category", "name").sort({ createdAt: -1 });
    res.json({ success: true, message: "Products fetched", data: products, error: null });
  } catch (error) {
    next(error);
  }
};

export const moderateProduct = async (req, res, next) => {
  try {
    const approvalStatus = req.body.approvalStatus || req.body.status;
    if (!["pending", "approved", "rejected"].includes(approvalStatus)) return res.status(400).json({ success: false, message: "Invalid approval status", data: null, error: null });
    const product = await Product.findByIdAndUpdate(req.params.id, { approvalStatus }, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found", data: null, error: null });
    const owner = await Vendor.findById(product.vendor);
    if (owner) await Notification.create({ user: owner.user, type: "product", title: `Product ${approvalStatus}`, message: `${product.name} has been ${approvalStatus}`, link: "/vendor" }).catch(() => {});
    res.json({ success: true, message: `Product ${approvalStatus}`, data: product, error: null });
  } catch (error) {
    next(error);
  }
};