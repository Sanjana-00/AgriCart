
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// Get all reviews for one product.
export async function getProductReviews(req, res, next) {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const product = await Product.findById(productId).select("_id");

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const reviews = await Review.find({ product: productId })
      .sort({ createdAt: -1 })
      .select("customerName rating comment createdAt")
      .lean();

    const averageRating = reviews.length
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          ).toFixed(1)
        )
      : 0;

    return res.json({
      reviews,
      totalReviews: reviews.length,
      averageRating
    });
  } catch (error) {
    return next(error);
  }
}

// Create a review for a purchased product.
export async function createProductReview(req, res, next) {
  try {
    const { productId } = req.params;
    const { customerName, customerPhone, rating, comment } = req.body || {};

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const name =
      typeof customerName === "string" ? customerName.trim() : "";
    const phone =
      typeof customerPhone === "string" ? customerPhone.trim() : "";
    const reviewText =
      typeof comment === "string" ? comment.trim() : "";
    const stars = Number(rating);

    if (!name || !phone || !Number.isInteger(stars) ||
        stars < 1 || stars > 5 || reviewText.length < 2 ||
        reviewText.length > 500) {
      return res.status(400).json({
        message: "Enter your name, phone number, a rating from 1 to 5, and a review of 2–500 characters."
      });
    }

    const product = await Product.findById(productId).select("_id");

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Only customers with a delivered order containing this product
    // may review it. This check uses the existing Order schema.
    const deliveredOrder = await Order.findOne({
      customerPhone: phone,
      status: "Delivered",
      "items.product": productId
    }).select("_id");

    if (!deliveredOrder) {
      return res.status(403).json({
        message: "You can review this product after its order is delivered."
      });
    }

    const review = await Review.create({
      product: productId,
      customerName: name,
      customerPhone: phone,
      rating: stars,
      comment: reviewText
    });

    return res.status(201).json({
      message: "Review submitted successfully.",
      review: {
        _id: review._id,
        customerName: review.customerName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      }
    });
  } catch (error) {
    // MongoDB duplicate-key error: same phone and product.
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already reviewed this product."
      });
    }

    return next(error);
  }
}
