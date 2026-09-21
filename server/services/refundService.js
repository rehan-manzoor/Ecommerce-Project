import stripe from "../config/stripe.js";
import Payment from "../models/Payment.js";
export const refundPayment = async (payment, amount, reason) => {
  if (!payment || !["succeeded", "refunded"].includes(payment.status))
    throw new Error("Payment is not refundable");
  const cents = Math.round(amount * 100);
  if (
    cents < 1 ||
    cents >
      payment.amount -
        payment.refunds
          .filter((entry) => entry.status !== "failed")
          .reduce((sum, entry) => sum + entry.amount, 0)
  )
    throw new Error("Invalid refund amount");
  const refund = await stripe.refunds.create(
    {
      payment_intent: payment.stripePaymentIntentId,
      amount: cents,
      reason: "requested_by_customer",
      metadata: { reason: String(reason).slice(0, 200) },
    },
    { idempotencyKey: `order-${payment._id}-${payment.refunds.length}-${cents}` }
  );
  await Payment.updateOne(
    { _id: payment._id },
    {
      $push: {
        refunds: { stripeRefundId: refund.id, amount: cents, reason, status: refund.status },
      },
    }
  );
  const fresh = await Payment.findById(payment._id);
  if (
    fresh.refunds
      .filter((entry) => entry.status !== "failed")
      .reduce((sum, entry) => sum + entry.amount, 0) >= fresh.amount
  ) {
    fresh.status = "refunded";
    await fresh.save();
  }
  return refund;
};
