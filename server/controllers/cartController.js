import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import { selectedVariant } from "../services/catalogService.js";

const populatedCart = (query) =>
  query.populate({
    path: "items.product",
    populate: [
      { path: "vendor", select: "storeName storeSlug" },
      { path: "category", select: "name" },
    ],
  });

export const getCart = async (req, res, next) => {
  try {
    const cart = await populatedCart(Cart.findOne({ user: req.user.userId }));

    res.json({
      success: true,
      message: "Cart fetched",
      data: cart || { items: [] },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, variantId = null } = req.body;
    const quantity = Number(req.body.quantity);

    if (
      !mongoose.isValidObjectId(productId) ||
      (variantId && !mongoose.isValidObjectId(variantId)) ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      status: "active",
      approvalStatus: "approved",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product is not available",
        data: null,
        error: null,
      });
    }

    let cart = await Cart.findOne({
      user: req.user.userId,
    });

    if (!cart) {
      cart = new Cart({
        user: req.user.userId,
        items: [],
      });
    }

    const choice = selectedVariant(product, variantId);

    const item = cart.items.find(
      (entry) =>
        entry.product.toString() === productId &&
        String(entry.variantId || "") === String(variantId || "")
    );

    const nextQuantity = (item?.quantity || 0) + quantity;

    if (nextQuantity > choice.stock) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock",
        data: null,
        error: null,
      });
    }

    if (item) {
      item.quantity = nextQuantity;
    } else {
      cart.items.push({
        product: productId,
        variantId,
        quantity,
      });
    }

    await cart.save();

    await populatedCart(Cart.findById(cart._id)).then((fresh) => {
      cart = fresh;
    });

    res.json({
      success: true,
      message: "Product added to cart",
      data: cart,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCart = async (req, res, next) => {
  try {
    const { productId, variantId = null } = req.body;
    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
        data: null,
        error: null,
      });
    }

    const [cart, product] = await Promise.all([
      Cart.findOne({ user: req.user.userId }),
      Product.findById(productId),
    ]);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
        data: null,
        error: null,
      });
    }

    const item = cart.items.find(
      (entry) =>
        entry.product.toString() === productId &&
        String(entry.variantId || "") === String(variantId || "")
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
        data: null,
        error: null,
      });
    }

    if (!product || quantity > selectedVariant(product, variantId).stock) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock",
        data: null,
        error: null,
      });
    }

    item.quantity = quantity;

    await cart.save();

    const fresh = await populatedCart(Cart.findById(cart._id));

    res.json({
      success: true,
      message: "Cart updated",
      data: fresh,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.userId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
        data: null,
        error: null,
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === req.params.productId &&
          String(item.variantId || "") === String(req.query.variantId || "")
        )
    );

    await cart.save();

    const fresh = await populatedCart(Cart.findById(cart._id));

    res.json({
      success: true,
      message: "Product removed from cart",
      data: fresh,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.userId },
      { $set: { items: [] } },
      { new: true }
    );

    res.json({
      success: true,
      message: "Cart cleared",
      data: cart || { items: [] },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
