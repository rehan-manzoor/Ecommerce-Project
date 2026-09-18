import Vendor from "../models/Vendor.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { uniqueSlug } from "../utils/slugify.js";
import { sendVendorApprovalEmail } from "../services/notificationService.js";
import Notification from "../models/Notification.js";

export const createVendor = async (req, res, next) => {
  try {
    const { storeName, description = "", logo = "", bannerImage = "" } = req.body;
    if (!storeName?.trim()) return res.status(400).json({ success: false, message: "Store name is required", data: null, error: null });
    if (await Vendor.findOne({ user: req.user.userId })) return res.status(400).json({ success: false, message: "Vendor application already exists", data: null, error: null });

    const vendor = await Vendor.create({
      user: req.user.userId,
      storeName: storeName.trim(),
      storeSlug: uniqueSlug(storeName),
      description,
      logo,
      bannerImage,
      status: "pending",
      approved: false,
    });
    res.status(201).json({ success: true, message: "Vendor application submitted for admin approval", data: vendor, error: null });
  } catch (error) {
    next(error);
  }
};

export const getMyVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.userId }).populate("user", "name email role");
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor profile not found", data: null, error: null });
    res.json({ success: true, message: "Vendor profile fetched", data: vendor, error: null });
  } catch (error) {
    next(error);
  }
};

export const updateMyVendor = async (req, res, next) => {
  try {
    const allowed = ["storeName", "description", "logo", "bannerImage"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.storeName) updates.storeSlug = uniqueSlug(updates.storeName);
    const vendor = await Vendor.findOneAndUpdate({ user: req.user.userId }, updates, { new: true, runValidators: true });
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor profile not found", data: null, error: null });
    res.json({ success: true, message: "Store profile updated", data: vendor, error: null });
  } catch (error) {
    next(error);
  }
};

export const getVendors = async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const vendors = await Vendor.find(filter).populate("user", "name email role").sort({ createdAt: -1 });
    res.json({ success: true, message: "Vendors fetched", data: vendors, error: null });
  } catch (error) {
    next(error);
  }
};

export const updateVendorStatus = async (req, res, next) => {
  try {
    const status = req.body.status || (req.body.approved === true ? "approved" : req.body.approved === false ? "rejected" : null);
    if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid vendor status", data: null, error: null });
    }

    const vendor = await Vendor.findById(req.params.id).populate("user");
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found", data: null, error: null });
    vendor.status = status;
    vendor.approved = status === "approved";
    vendor.rejectionReason = req.body.rejectionReason || "";
    await vendor.save();

    if (status === "approved" && vendor.user.role !== "admin") {
      vendor.user.role = "vendor";
      await vendor.user.save();
    }
    if (["rejected", "suspended"].includes(status) && vendor.user.role === "vendor") {
      vendor.user.role = "customer";
      await vendor.user.save();
    }

    await sendVendorApprovalEmail(vendor.user, vendor);
    await Notification.create({ user: vendor.user._id, type: "vendor", title: `Seller application ${status}`, message: vendor.rejectionReason || `Your store is ${status}`, link: status === "approved" ? "/vendor" : "/become-vendor" }).catch(() => {});
    res.json({ success: true, message: `Vendor ${status}`, data: vendor, error: null });
  } catch (error) {
    next(error);
  }
};

export const getPublicVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ storeSlug: req.params.slug, status: "approved" }).select("storeName storeSlug description logo bannerImage");
    if (!vendor) return res.status(404).json({ success: false, message: "Store not found", data: null, error: null });
    const products = await Product.find({ vendor: vendor._id, status: "active", approvalStatus: "approved" }).populate("category", "name slug").sort({ createdAt: -1 });
    res.json({ success: true, message: "Store fetched", data: { vendor, products }, error: null });
  } catch (error) {
    next(error);
  }
};
