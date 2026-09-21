import Coupon from "../models/Coupon.js";
import { validateCoupon } from "../services/couponService.js";
import Cart from "../models/Cart.js";
import { selectedVariant } from "../services/catalogService.js";

const ALLOWED_COUPON_FIELDS = [
  "code",
  "discountType",
  "discountValue",
  "minPurchaseAmount",
  "maxDiscountAmount",
  "expiresAt",
  "startsAt",
  "perUserLimit",
  "categories",
  "products",
  "vendors",
  "usageLimit",
  "active",
];

const getAllowedCouponFields = (body) =>
  Object.fromEntries(Object.entries(body).filter(([key]) => ALLOWED_COUPON_FIELDS.includes(key)));

export const createCoupon = async (req, res) => {
  try {
    const data = getAllowedCouponFields(req.body);

    if (data.code) {
      data.code = String(data.code).trim().toUpperCase();
    }

    const coupon = await Coupon.create(data);

    res.status(201).json({
      success: true,
      message: "Coupon created",
      data: coupon,
      error: null,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create coupon",
      data: null,
      error: { message: error.message },
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const updates = getAllowedCouponFields(req.body);

    if (updates.code) {
      updates.code = String(updates.code).trim().toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
        data: null,
        error: null,
      });
    }

    res.json({
      success: true,
      message: "Coupon updated",
      data: coupon,
      error: null,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update coupon",
      data: null,
      error: { message: error.message },
    });
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
        data: null,
        error: null,
      });
    }

    res.json({
      success: true,
      message: "Coupon deleted",
      data: coupon,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const validateCouponEndpoint = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.userId }).populate("items.product");
    if (!req.body.code || !cart?.items.length)
      return res
        .status(400)
        .json({ success: false, message: "Code and nonempty cart are required" });
    const items = cart.items.map((entry) => ({
      product: entry.product,
      quantity: entry.quantity,
      price: selectedVariant(entry.product, entry.variantId).price,
    }));
    const cartTotal =
      Math.round(items.reduce((sum, entry) => sum + entry.price * entry.quantity, 0) * 100) / 100;
    const { coupon, discountAmount } = await validateCoupon(
      req.body.code,
      cartTotal,
      req.user.userId,
      items
    );
    res.json({
      success: true,
      message: "Coupon applied",
      data: {
        code: coupon.code,
        discountAmount,
        finalTotal: Math.max(0, Math.round((cartTotal - discountAmount) * 100) / 100),
      },
      error: null,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message, data: null, error: null });
  }
};

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Coupons fetched",
      data: coupons,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
