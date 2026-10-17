import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { reviewApi } from '../api/reviewApi';

const ReviewsPage = () => {
  const { movieId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [loadedFor, setLoadedFor] = useState(null);
  const [error, setError] = useState('');
  const requestKey = movieId || 'all';

  useEffect(() => {
    let current = true;
    const request = movieId ? reviewApi.getByMovie(movieId) : reviewApi.getAll();
    request
      .then((data) => {
        if (!current) return;
        setReviews(data || []);
        setError('');
      })
      .catch(() => {
        if (current) setError('Không thể tải bài đánh giá. Hãy kiểm tra kết nối máy chủ.');
      })
      .finally(() => {
        if (current) setLoadedFor(movieId || 'all');
      });
    return () => {
      current = false;
    };
  }, [movieId]);

  const loading = loadedFor !== requestKey;
  const categories = ['Tất cả', ...new Set(reviews.map((review) => review.category))];
  const visibleReviews = activeCategory === 'Tất cả'
    ? reviews
    : reviews.filter((review) => review.category === activeCategory);
  const movieTitle = reviews[0]?.movieTitle;

  return (
    <div className="page-shell editorial-page">
      <section className="editorial-hero">
        <div className="editorial-hero-copy">
          <p className="eyebrow">{movieId ? 'GÓC NHÌN VỀ BỘ PHIM' : 'TẠP CHÍ CINEF · GÓC ĐIỆN ẢNH'}</p>
          <h1>{movieId ? <>{movieTitle || 'Bài viết'}<br /><span>Qua lăng kính CineF.</span></> : <>Một bộ phim.<br /><span>Muôn góc nhìn.</span></>}</h1>
          <p>{movieId ? 'Các bài đánh giá và phân tích được biên tập dành riêng cho bộ phim này.' : 'Những bài đánh giá, trò chuyện và ghi chép điện ảnh được biên tập bởi đội ngũ CineF.'}</p>
          {!movieId && <a className="editorial-hero-link" href="#latest-reviews">Khám phá bài viết <span>↓</span></a>}
        </div>
        <div className="editorial-cover" aria-label="Minh họa bìa tạp chí điện ảnh">
          <span className="cover-kicker">THE CINEF JOURNAL</span>
          <div className="cover-sun" />
          <span className="cover-title">AFTER<br />THE<br />LIGHT</span>
          <span className="cover-issue">FILM · CULTURE · PEOPLE</span>
          <span className="cover-caption">A story worth<br />staying for.</span>
        </div>
      </section>

      <section className="review-section" id="latest-reviews">
        <div className="review-section-heading">
          <div><p className="eyebrow">ĐỌC & CẢM NHẬN</p><h2>{movieId ? 'Bài viết về phim' : 'Góc nhìn điện ảnh'}</h2></div>
          {movieId && <Link className="back-link" to="/cinemas">← Quay lại rạp chiếu</Link>}
        </div>

        {!movieId && reviews.length > 0 && (
          <div className="review-filters" aria-label="Lọc bài viết">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? 'active' : ''}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {loading && <p className="muted">Đang tải bài viết...</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {!loading && !error && visibleReviews.length === 0 && (
          <p className="muted">{movieId ? 'Phim này chưa có bài đánh giá.' : 'Chưa có bài viết nào.'}</p>
        )}
        {!loading && !error && visibleReviews.length > 0 && (
          <div className="review-grid">
            {visibleReviews.map((review, index) => (
              <Link
                className={`review-card ${['peach', 'violet', 'blue'][index % 3]}`}
                key={review.id}
                to={`/reviews/${review.id}`}
              >
                <div className="review-art">
                  <span>{review.authorName?.slice(0, 1) || 'C'}</span>
                  <small>{review.category}</small>
                  <i />
                </div>
                <div className="review-card-content">
                  <div className="review-meta">
                    <span>{review.movieTitle}</span>
                    <time>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}</time>
                  </div>
                  <h3>{review.title}</h3>
                  <p>{review.excerpt}</p>
                  <div className="review-byline">
                    <span className="review-avatar">{review.authorName?.slice(0, 1) || 'C'}</span>
                    <span><strong>{review.authorName}</strong><small>{review.authorRole}</small></span>
                    {review.rating != null && <span className="review-score">★ {Number(review.rating).toFixed(1)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ReviewsPage;
