import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { reviewApi } from '../api/reviewApi';

const ReviewDetailPage = () => {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    reviewApi.getById(id)
      .then(setReview)
      .catch(() => setError('Không thể tải bài đánh giá này.'));
  }, [id]);

  if (error) return <div className="page-shell"><p className="form-error" role="alert">{error}</p></div>;
  if (!review) return <div className="page-shell"><p className="muted">Đang tải bài viết...</p></div>;

  return (
    <article className="page-shell editorial-page editorial-article">
      <Link className="back-link" to={`/reviews/movie/${review.movieId}`}>← Các bài viết về {review.movieTitle}</Link>
      <header className="editorial-article-header">
        <p className="eyebrow">{review.category} · {review.movieTitle}</p>
        <h1>{review.title}</h1>
        <p className="editorial-article-excerpt">{review.excerpt}</p>
        <div className="review-byline">
          <span className="review-avatar">{review.authorName?.slice(0, 1) || 'C'}</span>
          <span><strong>{review.authorName}</strong><small>{review.authorRole}</small></span>
          <time>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}</time>
          {review.rating != null && <span className="review-score">★ {Number(review.rating).toFixed(1)}</span>}
        </div>
      </header>
      <div className="editorial-article-body">{review.content}</div>
    </article>
  );
};

export default ReviewDetailPage;
