import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import ReturnRequest from "../models/ReturnRequest.js";
import Payment from "../models/Payment.js";

const startForRange = (range) => {
  const now = new Date();
  if (range === "12m") return new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};

export const getOverview = async (req, res, next) => {
  try {
    const [
      revenueAgg,
      totalOrders,
      totalCustomers,
      totalVendors,
      totalProducts,
      pendingProducts,
      pendingVendors,
      returns,
      refunds,
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: { $in: ["succeeded", "refunded"] }, order: { $ne: null } } },
        { $unwind: { path: "$refunds", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$_id",
            amount: { $first: "$amount" },
            refunded: {
              $sum: {
                $cond: [
                  { $ne: ["$refunds.status", "failed"] },
                  { $ifNull: ["$refunds.amount", 0] },
                  0,
                ],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $divide: [{ $subtract: ["$amount", "$refunded"] }, 100] } },
          },
        },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Vendor.countDocuments({ status: "approved" }),
      Product.countDocuments(),
      Product.countDocuments({ approvalStatus: "pending" }),
      Vendor.countDocuments({ status: "pending" }),
      ReturnRequest.countDocuments({ status: "requested" }),
      Payment.countDocuments({ "refunds.0": { $exists: true } }),
    ]);
    res.json({
      success: true,
      message: "Admin overview fetched",
      data: {
        totalRevenue: revenueAgg[0]?.total || 0,
        totalOrders,
        totalCustomers,
        totalVendors,
        totalProducts,
        pendingProducts,
        pendingVendors,
        returns,
        refunds,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getSalesOverTime = async (req, res, next) => {
  try {
    const range = ["7d", "30d", "12m"].includes(req.query.range) ? req.query.range : "30d";
    const start = startForRange(range);
    const dateFormat = range === "12m" ? "%Y-%m" : "%Y-%m-%d";
    const data = await Order.aggregate([
      {
        $match: { createdAt: { $gte: start }, paymentStatus: "paid", status: { $ne: "cancelled" } },
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, label: "$_id", revenue: 1, orders: 1 } },
    ]);
    res.json({ success: true, message: "Sales trend fetched", data, error: null });
  } catch (error) {
    next(error);
  }
};

export const getTopProducts = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { paymentStatus: "paid", status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          units: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);
    res.json({ success: true, message: "Top products fetched", data, error: null });
  } catch (error) {
    next(error);
  }
};

export const getTopVendors = async (req, res, next) => {
  try {
    const data = await Order.aggregate([
      { $match: { paymentStatus: "paid", status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.vendor",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          units: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" } },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, revenue: 1, units: 1, storeName: "$vendor.storeName" } },
    ]);
    res.json({ success: true, message: "Top vendors fetched", data, error: null });
  } catch (error) {
    next(error);
  }
};
