import mongoose from "mongoose";
import ReturnRequest from "../models/ReturnRequest.js";
import Order from "../models/Order.js";
import Vendor from "../models/Vendor.js";
import Notification from "../models/Notification.js";
import { refundPayment } from "../services/refundService.js";
const reject = (res, message, status = 400) => res.status(status).json({ success: false, message });
export const requestReturn = async (req, res) => {
  const order = mongoose.isValidObjectId(req.body.orderId)
    ? await Order.findOne({ _id: req.body.orderId, user: req.user.userId })
    : null;
  const group = order?.vendorOrders.find((entry) =>
    entry.items.some((item) => String(item.product) === req.body.productId)
  );
  if (
    !group ||
    group.status !== "delivered" ||
    !group.deliveredAt ||
    Date.now() - group.deliveredAt > 14 * 86400000
  )
    return reject(res, "Return window closed or item not delivered");
  const item = group.items.find((entry) => String(entry.product) === req.body.productId);
  const quantity = Number(req.body.quantity);
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > item.quantity ||
    String(req.body.reason || "").trim().length < 3
  )
    return reject(res, "Quantity and reason are required");
  const result = await ReturnRequest.create({
    user: req.user.userId,
    order: order._id,
    vendor: group.vendor,
    product: item.product,
    quantity,
    reason: String(req.body.reason).trim(),
    description: String(req.body.description || "").slice(0, 1000),
    refundAmount: Math.round(item.price * quantity * 100) / 100,
  });
  group.status = "return_requested";
  group.history.push({ status: "return_requested" });
  await order.save();
  return res.status(201).json({ success: true, data: result });
};
export const myReturns = async (req, res) =>
  res.json({
    success: true,
    data: await ReturnRequest.find({ user: req.user.userId })
      .populate("product", "name images")
      .sort({ createdAt: -1 }),
  });
export const managedReturns = async (req, res) => {
  const vendor =
    req.user.role === "vendor"
      ? await Vendor.findOne({ user: req.user.userId, status: "approved" })
      : null;
  if (req.user.role === "vendor" && !vendor) return reject(res, "Approved vendor required", 403);
  res.json({
    success: true,
    data: await ReturnRequest.find(vendor ? { vendor: vendor._id } : {})
      .populate("product", "name")
      .populate("user", "name email")
      .sort({ createdAt: -1 }),
  });
};
export const updateReturn = async (req, res) => {
  const vendor =
    req.user.role === "vendor"
      ? await Vendor.findOne({ user: req.user.userId, status: "approved" })
      : null;
  const result = mongoose.isValidObjectId(req.params.id)
    ? await ReturnRequest.findOne({ _id: req.params.id, ...(vendor ? { vendor: vendor._id } : {}) })
    : null;
  if (!result) return reject(res, "Return not found", 404);
  const transitions = {
    requested: ["approved", "rejected"],
    approved: ["item_received"],
    item_received: ["refund_processing"],
    refund_processing: ["refunded"],
  };
  if (!transitions[result.status]?.includes(req.body.status))
    return reject(res, "Invalid return transition");
  if (
    req.user.role === "vendor" &&
    !["approved", "rejected", "item_received"].includes(req.body.status)
  )
    return reject(res, "Admin must process refunds", 403);
  if (req.body.status === "refunded") {
    const order = await Order.findById(result.order).populate("payment");
    try {
      const refund = await refundPayment(order.payment, result.refundAmount, result.reason);
      if (refund.status === "failed") return reject(res, "Stripe refund failed", 502);
      result.stripeRefundId = refund.id;
      if (refund.status !== "succeeded") {
        await result.save();
        return res
          .status(202)
          .json({ success: true, message: "Stripe refund is processing", data: result });
      }
    } catch (error) {
      console.error("Return refund processing failed:", error);

      return reject(res, "Unable to process refund", 502);
    }
    const group = order.vendorOrders.find(
      (entry) => String(entry.vendor) === String(result.vendor)
    );
    group.status = "refunded";
    group.history.push({ status: "refunded" });
    await order.save();
  }
  result.status = req.body.status;
  if (req.user.role === "admin") result.adminNote = String(req.body.note || "").slice(0, 500);
  else result.vendorNote = String(req.body.note || "").slice(0, 500);
  await result.save();
  await Notification.create({
    user: result.user,
    type: "return",
    title: "Return updated",
    message: `Return status: ${result.status}`,
    link: "/returns",
  }).catch(() => {});
  return res.json({ success: true, data: result });
};
