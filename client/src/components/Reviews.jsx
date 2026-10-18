
import { useCallback, useEffect, useState } from "react";
import "./Reviews.css";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reviews`;

export default function Reviews({ productId, customer }) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(productId)}`
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not load reviews.");
      }

      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setAverageRating(Number(data.averageRating) || 0);
      setTotalReviews(Number(data.totalReviews) || 0);
    } catch (error) {
      setMessage(error.message || "Could not connect to the server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    if (!productId) {
      setMessage("Product ID is missing. Please reopen the product.");
      setMessageType("error");
      return;
    }

    if (!customer?.name?.trim() || !customer?.phone?.trim()) {
      setMessage(
        "Customer name or phone number is missing. Please log in again."
      );
      setMessageType("error");
      return;
    }

    const reviewText = comment.trim();

    if (reviewText.length < 2 || reviewText.length > 500) {
      setMessage("Your review must contain between 2 and 500 characters.");
      setMessageType("error");
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setMessage("Please select a rating from 1 to 5 stars.");
      setMessageType("error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(productId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
  customerName: customer.name.trim(),
  customerPhone: String(customer.phone).trim(),
  rating,
  comment: reviewText
})
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Review submission failed (${response.status}).`
        );
      }

      setComment("");
      setRating(5);

      setMessage("Your review was saved successfully!");
      setMessageType("success");

      // Fetch saved reviews from MongoDB again.
      await loadReviews();
    } catch (error) {
      setMessage(
        error.message ||
          "Could not submit your review. Please try again."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="reviews-section">
      <h2>Customer Reviews</h2>

      <div className="reviews-summary">
        <strong>{averageRating.toFixed(1)} / 5</strong>

        <span className="review-stars" aria-label={`${averageRating} out of 5 stars`}>
          {"★".repeat(Math.round(averageRating))}
          {"☆".repeat(5 - Math.round(averageRating))}
        </span>

        <span>
          {totalReviews} review{totalReviews === 1 ? "" : "s"}
        </span>
      </div>

      <form className="review-form" onSubmit={handleSubmit}>
        <h3>Write a review</h3>

        <label htmlFor="review-rating">Your rating</label>

        <div className="star-picker" id="review-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={star <= rating ? "star selected" : "star"}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} out of 5`}
              aria-pressed={rating === star}
            >
              ★
            </button>
          ))}
        </div>

        <label htmlFor="review-comment">Your review</label>

        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Tell others about the product..."
          minLength={2}
          maxLength={500}
          required
          rows={4}
          disabled={submitting}
        />

        <button type="submit" disabled={submitting || !productId}>
          {submitting ? "Submitting..." : "Submit review"}
        </button>

        {message && (
          <p
            role="status"
            style={{
              color: messageType === "error" ? "#b42318" : "#267247"
            }}
          >
            {message}
          </p>
        )}
      </form>

      <div className="reviews-list">
        <h3>What customers say</h3>

        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews yet for this product.</p>
        ) : (
          reviews.map((review) => (
            <article className="review-card" key={review._id}>
              <div className="review-card-heading">
                <strong>{review.customerName}</strong>

                <span
                  className="review-stars"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>

              <p>{review.comment}</p>

              <small>
                {review.createdAt
                  ? new Date(review.createdAt).toLocaleDateString()
                  : ""}
              </small>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
