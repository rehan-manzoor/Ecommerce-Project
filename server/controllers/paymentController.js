import stripe from "../config/stripe.js";
import Payment from "../models/Payment.js";
import { getCartPricing } from "../services/pricingService.js";
import ReturnRequest from "../models/ReturnRequest.js";
import Order from "../models/Order.js";

export const createPaymentIntent = async (req, res, next) => {
  try {
    const currency = "usd";
    const { items, subtotalAmount, discountAmount, shippingAmount, taxAmount, totalAmount, coupon, shippingMethod } = await getCartPricing(req.user.userId, req.body.couponCode || "", req.body.shippingMethodId);
    if (totalAmount <= 0) return res.status(400).json({ success: false, message: "Order total must be greater than zero", data: null, error: null });

    const amount = Math.round(totalAmount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { userId: req.user.userId, couponCode: coupon?.code || "" },
    });

    const payment = await Payment.create({
      user: req.user.userId,
      stripePaymentIntentId: paymentIntent.id,
      amount,
      currency,
      subtotalAmount,
      discountAmount,
      totalAmount,
      couponCode: coupon?.code || "",
      shippingAmount, taxAmount, shippingMethod: shippingMethod?._id || null,
      cartSnapshot: items.map(({ product, variantId, quantity, price }) => ({ product: product._id, variantId, quantity, price })),
    });

    res.status(201).json({
      success: true,
      message: "Payment intent created",
      data: {
        paymentId: payment._id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        pricing: { subtotalAmount, discountAmount, shippingAmount, taxAmount, totalAmount, couponCode: coupon?.code || "" },
      },
      error: null,
    });
  } catch (error) {
  error.statusCode = 400;

  if (
    error.message === "Coupon is not active" ||
    error.message === "Coupon expired" ||
    error.message === "Coupon not found" ||
    error.message === "Select a shipping method" ||
    error.message?.startsWith("Not enough stock for") ||
    error.message === "Cart is empty" ||
    error.message === "A product in your cart is unavailable"
  ) {
    error.publicMessage = error.message;
  } else {
    error.publicMessage = "Failed to create payment intent";
  }

  next(error);
}
};

export const stripeWebhook = async (req, res) => {
  try {
    const event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
    if (["payment_intent.succeeded", "payment_intent.payment_failed"].includes(event.type)) {
      const intent = event.data.object;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id, status: { $ne: "refunded" } },
        { status: event.type === "payment_intent.succeeded" ? "succeeded" : "failed" }
      );
    }
    if (event.type === "refund.updated") {
      const refund = event.data.object;
      await Payment.updateOne({ "refunds.stripeRefundId": refund.id }, { $set: { "refunds.$.status": refund.status } });
      if (refund.status === "succeeded") {
        const request = await ReturnRequest.findOneAndUpdate({ stripeRefundId: refund.id }, { status: "refunded" }, { new: true });
        if (request) {
          const order = await Order.findById(request.order);
          const group = order?.vendorOrders.find((entry) => String(entry.vendor) === String(request.vendor));
          if (group) { group.status = "refunded"; group.history.push({ status: "refunded" }); await order.save(); }
        }
      }
    }
    res.status(200).json({ received: true });
  } catch (error) {
    res.status(400).json({ success: false, message: "Webhook error", data: null, error: null });
  }
};

export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, user: req.user.userId });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found", data: null, error: null });
    res.json({ success: true, message: "Payment fetched", data: payment, error: null });
  } catch (error) {
    next(error);
  }
};