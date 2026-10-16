
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number from 1 to 5."
      }
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 500
    }
  },
  { timestamps: true }
);

reviewSchema.index(
  { product: 1, customerPhone: 1 },
  { unique: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
