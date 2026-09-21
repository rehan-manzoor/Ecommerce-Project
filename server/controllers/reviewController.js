import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const recalculateProductRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), status: "approved" } },
    { $group: { _id: "$product", average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    ratingsAverage: stats ? Math.round(stats.average * 10) / 10 : 0,
    numReviews: stats?.count || 0,
  });
};

export const createReview = async (req, res, next) => {
  try {
    const product = req.body.product || req.body.productId;
    const order = req.body.order || req.body.orderId;
    const { rating, comment, title = "", images = [] } = req.body;
    if (!product || !order || !rating || !comment?.trim())
      return res.status(400).json({
        success: false,
        message: "Product, order, rating and comment are required",
        data: null,
        error: null,
      });
    if (await Review.findOne({ user: req.user.userId, product }))
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product",
        data: null,
        error: null,
      });
    const userOrder = await Order.findOne({ _id: order, user: req.user.userId });
    if (
      !userOrder?.vendorOrders.some(
        (group) =>
          group.status === "delivered" &&
          group.items.some((item) => String(item.product) === String(product))
      )
    )
      return res.status(400).json({
        success: false,
        message: "You can review only products from your delivered orders",
        data: null,
        error: null,
      });
    const review = await Review.create({
      user: req.user.userId,
      product,
      order,
      rating: Number(rating),
      title: String(title).slice(0, 100),
      comment: comment.trim(),
      images,
    });
    await review.populate("user", "name");
    res
      .status(201)
      .json({ success: true, message: "Review submitted for approval", data: review, error: null });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Already reviewed", data: null, error: null });
    }
    error.statusCode = 400;
    error.publicMessage = "Failed to create review";
    next(error);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, status: "approved" })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      message: "Reviews fetched successfully",
      data: reviews,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find(req.query.status ? { status: req.query.status } : {})
      .populate("user", "name email")
      .populate("product", "name")
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      message: "All reviews fetched successfully",
      data: reviews,
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found", data: null, error: null });
    await recalculateProductRating(review.product);
    res.json({ success: true, message: "Review approved successfully", data: review, error: null });
  } catch (error) {
    next(error);
  }
};

export const rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found", data: null, error: null });
    await recalculateProductRating(review.product);
    res.json({ success: true, message: "Review rejected successfully", data: review, error: null });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found", data: null, error: null });
    if (review.user.toString() !== req.user.userId && req.user.role !== "admin")
      return res
        .status(403)
        .json({ success: false, message: "Access denied", data: null, error: null });
    const productId = review.product;
    await review.deleteOne();
    await recalculateProductRating(productId);
    res.json({ success: true, message: "Review deleted", data: null, error: null });
  } catch (error) {
    next(error);
  }
};
