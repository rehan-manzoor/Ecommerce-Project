import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";

export const getVendorOverview = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.userId, status: "approved" });
    if (!vendor) return res.status(403).json({ success: false, message: "Approved vendor profile required", data: null, error: null });
    const [revenue, orderIds, totalProducts, rating, outOfStock, lowStock] = await Promise.all([
      Order.aggregate([
        { $match: { "vendorOrders.vendor": vendor._id, paymentStatus: "paid" } },
        { $unwind: "$vendorOrders" },
        { $match: { "vendorOrders.vendor": vendor._id, "vendorOrders.status": { $nin: ["cancelled", "refunded"] } } },
        { $unwind: "$vendorOrders.items" },
        { $group: { _id: null, total: { $sum: { $multiply: ["$vendorOrders.items.price", "$vendorOrders.items.quantity"] } } } },
      ]),
      Order.distinct("_id", { "items.vendor": vendor._id }),
      Product.countDocuments({ vendor: vendor._id }),
      Product.aggregate([{ $match: { vendor: vendor._id } }, { $group: { _id: null, average: { $avg: "$ratingsAverage" } } }]),
      Product.countDocuments({ vendor: vendor._id, stock: 0, "variants.0": { $exists: false } }),
      Product.countDocuments({ vendor: vendor._id, $expr: { $lte: ["$stock", "$lowStockThreshold"] }, stock: { $gt: 0 }, "variants.0": { $exists: false } }),
    ]);
    res.json({
      success: true,
      message: "Vendor overview fetched",
      data: {
        totalRevenue: revenue[0]?.total || 0,
        totalOrders: orderIds.length,
        totalProducts,
        averageRating: Math.round((rating[0]?.average || 0) * 10) / 10,
        outOfStock, lowStock,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getVendorSales = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.userId, status: "approved" });
    if (!vendor) return res.status(403).json({ success: false, message: "Approved vendor profile required", data: null, error: null });
    const days = req.query.range === "7d" ? 7 : 30;
    const start = new Date(Date.now() - days * 86400000);
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: start }, "vendorOrders.vendor": vendor._id, paymentStatus: "paid" } },
      { $unwind: "$vendorOrders" },
      { $match: { "vendorOrders.vendor": vendor._id, "vendorOrders.status": { $nin: ["cancelled", "refunded"] } } },
      { $unwind: "$vendorOrders.items" },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: { $multiply: ["$vendorOrders.items.price", "$vendorOrders.items.quantity"] } }, units: { $sum: "$vendorOrders.items.quantity" } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: "$_id", revenue: 1, units: 1 } },
    ]);
    res.json({ success: true, message: "Vendor sales fetched", data, error: null });
  } catch (error) {
    next(error);
  }
};

export const getVendorTopProducts = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user.userId, status: "approved" });
    if (!vendor) return res.status(403).json({ success: false, message: "Approved vendor profile required", data: null, error: null });
    const data = await Order.aggregate([
      { $match: { "vendorOrders.vendor": vendor._id, paymentStatus: "paid" } },
      { $unwind: "$vendorOrders" },
      { $match: { "vendorOrders.vendor": vendor._id, "vendorOrders.status": { $nin: ["cancelled", "refunded"] } } },
      { $unwind: "$vendorOrders.items" },
      { $group: { _id: "$vendorOrders.items.product", name: { $first: "$vendorOrders.items.name" }, revenue: { $sum: { $multiply: ["$vendorOrders.items.price", "$vendorOrders.items.quantity"] } }, units: { $sum: "$vendorOrders.items.quantity" } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);
    res.json({ success: true, message: "Top products fetched", data, error: null });
  } catch (error) {
    next(error);
  }
};
