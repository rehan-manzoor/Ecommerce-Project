import { EmptyState } from "./EmptyState.jsx";
export function ReviewsTab({
  reviews,
  onApprove,
  onReject,
}) {
  return (
    <>
      <div className="page-title">
        <h1>Review moderation</h1>
        <p>
          Approve or reject customer feedback before it goes
          live.
        </p>
      </div>

      {!reviews.length && (
        <EmptyState title="No reviews to moderate" />
      )}

      <div className="management-list">
        {reviews.map((review) => (
          <div
            className="management-card panel"
            key={review._id}
          >
            <div>
              <h3>{review.product?.name}</h3>
              <p>
                {review.user?.name} ·{" "}
                {"★".repeat(review.rating)}
              </p>
              <p>{review.comment}</p>
            </div>

            <div className="management-actions">
              <span
                className={`status-badge ${review.status}`}
              >
                {review.status}
              </span>

              <button
                className="button small"
                onClick={() => onApprove(review)}
              >
                Approve
              </button>

              <button
                className="button danger small"
                onClick={() => onReject(review)}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
