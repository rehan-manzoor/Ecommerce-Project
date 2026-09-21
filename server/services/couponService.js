import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import { money } from "./catalogService.js";
export const validateCoupon = async (code, cartTotal, userId, items = []) => {
  if (!code) return { coupon: null, discountAmount: 0 };
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon) throw new Error("Coupon not found");
  if (
    !coupon.active ||
    (coupon.startsAt && coupon.startsAt > new Date()) ||
    coupon.expiresAt < new Date()
  )
    throw new Error("Coupon is not active");
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    throw new Error("Coupon usage limit reached");
  if (cartTotal < coupon.minPurchaseAmount)
    throw new Error(`Minimum purchase amount is $${coupon.minPurchaseAmount.toFixed(2)}`);
  if (
    userId &&
    coupon.perUserLimit &&
    (await Order.countDocuments({ user: userId, couponCode: coupon.code })) >= coupon.perUserLimit
  )
    throw new Error("Your coupon usage limit was reached");
  let eligibleTotal = cartTotal;
  if (
    items.length &&
    (coupon.products?.length || coupon.categories?.length || coupon.vendors?.length)
  ) {
    eligibleTotal = money(
      items
        .filter(
          ({ product }) =>
            (!coupon.products.length || coupon.products.some((id) => id.equals(product._id))) &&
            (!coupon.categories.length ||
              coupon.categories.some((id) => id.equals(product.category))) &&
            (!coupon.vendors.length || coupon.vendors.some((id) => id.equals(product.vendor)))
        )
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
    if (!eligibleTotal) throw new Error("Coupon is not valid for these products");
  }
  let discountAmount =
    coupon.discountType === "percentage"
      ? (eligibleTotal * coupon.discountValue) / 100
      : coupon.discountValue;
  if (coupon.maxDiscountAmount != null)
    discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  return { coupon, discountAmount: money(Math.min(discountAmount, eligibleTotal)) };
};
