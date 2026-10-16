
import express from "express";
import {
  getProductReviews,
  createProductReview
} from "../controllers/reviewController.js";

const router = express.Router();

// GET /api/reviews/:productId
router.get("/:productId", getProductReviews);

// POST /api/reviews/:productId
router.post("/:productId", createProductReview);

export default router;
