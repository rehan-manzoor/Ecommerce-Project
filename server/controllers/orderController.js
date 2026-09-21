import mongoose from 'mongoose';
import stripe from '../config/stripe.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import { finalizePaidOrder } from "../services/orderFinalizationService.js";
import Notification from '../models/Notification.js';
import { selectedVariant, money } from '../services/catalogService.js';
import { refundPayment } from '../services/refundService.js';
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from '../services/notificationService.js';
const populate = [{ path: 'user', select: 'name email' }, { path: 'items.product', select: 'name images' }, { path: 'items.vendor', select: 'storeName storeSlug' }, { path: 'vendorOrders.vendor', select: 'storeName storeSlug' }];
const fail = (res, code, message) => res.status(code).json({ success: false, message });
const notify = (user, type, title, message, link) => Notification.create({ user, type, title, message, link }).catch(() => {});
const reserve = async (items) => {
  const reserved = [];
  try {
    for (const item of items) {
      const field = item.variantId ? 'variants.$.stock' : 'stock';
      const filter = { _id: item.product._id, status: 'active', approvalStatus: 'approved' };
      if (item.variantId) filter.variants = { $elemMatch: { _id: item.variantId, stock: { $gte: item.quantity } } };
      else filter.stock = { $gte: item.quantity };
      const result = await Product.updateOne(filter, { $inc: { [field]: -item.quantity } });
      if (!result.modifiedCount) throw new Error(`Not enough stock for ${item.product.name}`);
      reserved.push({ product: item.product._id, variantId: item.variantId, quantity: item.quantity });
    }
    return reserved;
  } catch (error) { await restore(reserved); throw error; }
};
const restore = (items) => Promise.all(items.map((item) => Product.updateOne({ _id: item.product, ...(item.variantId ? { 'variants._id': item.variantId } : {}) }, { $inc: { [item.variantId ? 'variants.$.stock' : 'stock']: item.quantity } })));
const safeAddress = (body) => {
  const fields = ['address','city','postalCode','country'];
  if (!fields.every((field) => typeof body?.[field] === 'string' && body[field].trim().length && body[field].length <= 160)) throw new Error('Complete shipping address is required');
  return Object.fromEntries([...fields,'state'].map((field) => [field, String(body[field] || '').trim()]));
};
const aggregateStatus = (order) => {
  const statuses = order.vendorOrders.map((group) => group.status);
  if (statuses.every((status) => status === 'cancelled')) return 'cancelled';
  if (statuses.every((status) => status === 'delivered')) return 'delivered';
  if (statuses.some((status) => status === 'shipped' || status === 'delivered')) return 'shipped';
  if (statuses.some((status) => status === 'processing')) return 'processing';
  return 'paid';
};
export const createOrder = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
      user: req.user.userId,
    });

    if (!payment) {
      return fail(
        res,
        404,
        "Payment not found"
      );
    }

    const intent =
      await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

    if (
      intent.status !== "succeeded" ||
      intent.amount !== payment.amount ||
      intent.currency !== payment.currency
    ) {
      return fail(
        res,
        400,
        "Payment has not been verified"
      );
    }

    payment.status = "succeeded";
    await payment.save();

    const order =
      await finalizePaidOrder(payment);

    return res.status(201).json({
      success: true,
      message: "Order created",
      data: await Order.findById(
        order._id
      ).populate(populate),
    });
  } catch (error) {
    console.error(
      "Order creation failed:",
      error
    );

    return fail(
      res,
      400,
      "Unable to create order"
    );
  }
};
export const getMyOrders = async (req, res) => res.json({ success: true, data: await Order.find({ user: req.user.userId }).populate(populate).sort({ createdAt: -1 }) });
export const getOrderById = async (req, res) => {
  const order = mongoose.isValidObjectId(req.params.id) ? await Order.findById(req.params.id).populate(populate) : null;
  if (!order) return fail(res, 404, 'Order not found');
  if (req.user.role === 'admin' || String(order.user._id) === req.user.userId) return res.json({ success: true, data: order });
  if (req.user.role !== 'vendor') return fail(res, 403, 'Access denied');
  const vendor = await Vendor.findOne({ user: req.user.userId, status: 'approved' });
  const group = order.vendorOrders.find((entry) => String(entry.vendor?._id || entry.vendor) === String(vendor?._id));
  if (!group) return fail(res, 403, 'Access denied');
  return res.json({ success: true, data: { _id: order._id, user: order.user, shippingAddress: order.shippingAddress, vendorOrders: [group], items: group.items, status: group.status, totalAmount: group.subtotal, createdAt: order.createdAt } });
};
export const getAllOrders = async (req, res) => res.json({ success: true, data: await Order.find(req.query.status ? { status: req.query.status } : {}).populate(populate).sort({ createdAt: -1 }) });
export const getVendorOrders = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.userId, status: 'approved' });
  if (!vendor) return fail(res, 403, 'Approved vendor required');
  const orders = await Order.find({ 'vendorOrders.vendor': vendor._id }).populate(populate).sort({ createdAt: -1 });
  return res.json({ success: true, data: orders.map((order) => {
    const group = order.vendorOrders.find((entry) => String(entry.vendor?._id || entry.vendor) === String(vendor._id));
    return { _id: order._id, user: order.user, items: group.items, vendorOrders: [group], status: group.status, totalAmount: group.subtotal, shippingAddress: order.shippingAddress, createdAt: order.createdAt };
  }) });
};
const transition = (group, status) => ({ confirmed: ['processing','cancelled'], processing: ['shipped'], shipped: ['delivered'], delivered: ['return_requested'], return_requested: ['returned'], returned: ['refunded'] })[group.status]?.includes(status);
export const updateVendorOrderStatus = async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.userId, status: 'approved' });
  const order = vendor && mongoose.isValidObjectId(req.params.id) ? await Order.findOne({ _id: req.params.id, 'vendorOrders.vendor': vendor._id }) : null;
  if (!order) return fail(res, 404, 'Vendor order not found');
  const group = order.vendorOrders.find((entry) => String(entry.vendor) === String(vendor._id));
  if (!['processing','shipped'].includes(req.body.status) || !transition(group, req.body.status)) return fail(res, 400, 'Invalid vendor status transition');
  if (req.body.status === 'shipped' && (!String(req.body.carrier || '').trim() || !String(req.body.trackingNumber || '').trim())) return fail(res, 400, 'Carrier and tracking number are required');
  group.status = req.body.status;
  if (group.status === 'shipped') { group.carrier = String(req.body.carrier).slice(0, 80); group.trackingNumber = String(req.body.trackingNumber).slice(0, 100); group.shippedAt = new Date(); }
  group.history.push({ status: group.status, changedAt: new Date() });
  order.status = aggregateStatus(order); order.statusHistory.push({ status: order.status, note: `${vendor.storeName} updated fulfillment` });
  await order.save();
  await notify(order.user, 'shipping', 'Order update', `${vendor.storeName}: ${group.status}`, '/orders');
  return res.json({ success: true, data: group });
};
export const updateOrderStatus = async (req, res) => {
  const order = mongoose.isValidObjectId(req.params.id) ? await Order.findById(req.params.id) : null;
  if (!order) return fail(res, 404, 'Order not found');
  const group = order.vendorOrders.find((entry) => String(entry.vendor) === req.body.vendorId);
  if (!group || !['processing','shipped','delivered'].includes(req.body.status) || !transition(group, req.body.status)) return fail(res, 400, 'Select a vendor group and valid next status');
  group.status = req.body.status;
  if (group.status === 'shipped') { if (!req.body.carrier || !req.body.trackingNumber) return fail(res, 400, 'Tracking details required'); group.carrier = String(req.body.carrier).slice(0, 80); group.trackingNumber = String(req.body.trackingNumber).slice(0, 100); group.shippedAt = new Date(); }
  if (group.status === 'delivered') group.deliveredAt = new Date();
  group.history.push({ status: group.status, changedAt: new Date() }); order.status = aggregateStatus(order); order.statusHistory.push({ status: order.status });
  await order.save(); await notify(order.user, 'order', 'Fulfillment update', `Your order is ${group.status}`, '/orders');
  const user = await User.findById(order.user); if (user) sendOrderStatusUpdateEmail(user, order, group.status).catch(() => {});
  res.json({ success: true, data: await Order.findById(order._id).populate(populate) });
};
export const cancelVendorOrder = async (req, res) => {
  const order = mongoose.isValidObjectId(req.params.id) ? await Order.findById(req.params.id).populate('payment') : null;
  if (!order) return fail(res, 404, 'Order not found');
  if (req.user.role !== 'admin' && String(order.user) !== req.user.userId) return fail(res, 403, 'Access denied');
  const group = order.vendorOrders.find((entry) => String(entry.vendor) === req.params.vendorId);
  if (!group || !['confirmed','pending'].includes(group.status)) return fail(res, 400, 'This vendor order cannot be cancelled');
  const reason = String(req.body.reason || '').trim();
  if (reason.length < 3) return fail(res, 400, 'Cancellation reason is required');
  const allocated = money(order.totalAmount * group.subtotal / order.subtotalAmount);
  try {
    const refund = await refundPayment(order.payment, allocated, reason);
    if (refund.status === 'failed') return fail(res, 502, 'Stripe refund failed');
    await restore(group.items.map((item) => ({ product: item.product, variantId: item.variantId, quantity: item.quantity })));
    group.status = 'cancelled'; group.cancellationReason = reason; group.history.push({ status: 'cancelled' });
    order.status = aggregateStatus(order); order.statusHistory.push({ status: order.status, note: 'Cancellation and refund initiated' });
    await order.save(); await notify(order.user, 'refund', 'Cancellation submitted', 'Refund initiated through Stripe', '/orders');
    return res.json({ success: true, data: order });
  } catch (error) {
  console.error("Vendor order refund failed:", error);

  return fail(
    res,
    502,
    "Unable to process refund"
  );
}
};
