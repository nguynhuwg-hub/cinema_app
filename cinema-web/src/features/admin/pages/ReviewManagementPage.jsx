import { useEffect, useState } from 'react';
import { movieApi } from '../../movie/api/movieApi';
import { reviewApi } from '../../reviews/api/reviewApi';

const emptyReview = {
  movieId: '',
  category: 'Đánh giá phim',
  title: '',
  excerpt: '',
  content: '',
  authorName: '',
  authorRole: '',
  rating: '',
};

const ReviewManagementPage = () => {
  const [movies, setMovies] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(emptyReview);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadReviews = () => reviewApi.getAll().then((data) => setReviews(data || []));

  useEffect(() => {
    Promise.all([movieApi.getAll(), reviewApi.getAll()])
      .then(([movieData, reviewData]) => {
        setMovies(movieData || []);
        setReviews(reviewData || []);
        setForm((current) => ({ ...current, movieId: movieData?.[0]?.id?.toString() || '' }));
      })
      .catch(() => setError('Không thể tải phim hoặc bài đánh giá. Hãy kiểm tra kết nối máy chủ.'))
      .finally(() => setLoading(false));
  }, []);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyReview, movieId: movies[0]?.id?.toString() || '' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = {
      ...form,
      movieId: Number(form.movieId),
      rating: form.rating === '' ? null : Number(form.rating),
    };

    try {
      if (editingId) {
        await reviewApi.update(editingId, payload);
        setMessage('Đã cập nhật bài đánh giá.');
      } else {
        await reviewApi.create(payload);
        setMessage('Đã đăng bài đánh giá.');
      }
      resetForm();
      await loadReviews();
    } catch (requestError) {
      const status = requestError.response?.status;
      setError(status === 403
        ? 'Tài khoản hiện tại không có quyền quản lý bài viết.'
        : requestError.response?.data?.message || 'Không thể lưu bài đánh giá.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (review) => {
    setEditingId(review.id);
    setForm({
      movieId: String(review.movieId),
      category: review.category,
      title: review.title,
      excerpt: review.excerpt,
      content: review.content,
      authorName: review.authorName,
      authorRole: review.authorRole,
      rating: review.rating ?? '',
    });
    setError('');
    setMessage('');
  };

  const remove = async (review) => {
    if (!window.confirm(`Xóa bài "${review.title}"?`)) return;
    setError('');
    setMessage('');
    try {
      await reviewApi.remove(review.id);
      setReviews((current) => current.filter((item) => item.id !== review.id));
      if (editingId === review.id) resetForm();
      setMessage('Đã xóa bài đánh giá.');
    } catch (requestError) {
      setError(requestError.response?.status === 403
        ? 'Tài khoản hiện tại không có quyền xóa bài viết.'
        : requestError.response?.data?.message || 'Không thể xóa bài đánh giá.');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <p className="eyebrow">CONTENT STUDIO</p>
        <h1>Quản lý bài đánh giá</h1>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}
      <div className="admin-split">
        <form className="admin-form" onSubmit={submit}>
          <h2>{editingId ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}</h2>
          <label>Phim
            <select name="movieId" value={form.movieId} onChange={change} required disabled={!movies.length}>
              <option value="" disabled>Chọn phim</option>
              {movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}
            </select>
          </label>
          <label>Thể loại
            <select name="category" value={form.category} onChange={change}>
              <option>Đánh giá phim</option>
              <option>Góc nhìn</option>
              <option>Phỏng vấn</option>
            </select>
          </label>
          <input name="title" placeholder="Tiêu đề bài viết" value={form.title} onChange={change} maxLength="200" required />
          <textarea name="excerpt" placeholder="Tóm tắt ngắn hiển thị ở danh sách bài viết" value={form.excerpt} onChange={change} maxLength="500" required />
          <textarea name="content" placeholder="Nội dung bài viết" value={form.content} onChange={change} required />
          <div className="form-grid">
            <input name="authorName" placeholder="Tên tác giả" value={form.authorName} onChange={change} maxLength="100" required />
            <input name="authorRole" placeholder="Vai trò tác giả" value={form.authorRole} onChange={change} maxLength="120" required />
          </div>
          <label>Điểm đánh giá (không bắt buộc)
            <input name="rating" type="number" min="0" max="5" step="0.1" placeholder="0–5" value={form.rating} onChange={change} />
          </label>
          <button className="primary-button" disabled={saving || !movies.length}>
            {saving ? 'Đang lưu...' : editingId ? 'Cập nhật bài viết' : 'Đăng bài viết'}
          </button>
          {editingId && <button type="button" className="text-button" onClick={resetForm}>Hủy chỉnh sửa</button>}
        </form>

        <div className="admin-table-wrap">
          {loading ? <p className="muted">Đang tải bài viết...</p> : (
            <table className="admin-table">
              <thead><tr><th>Bài viết</th><th>Phim</th><th>Thể loại</th><th /></tr></thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id}>
                    <td><strong>{review.title}</strong><small>{review.authorName}</small></td>
                    <td>{review.movieTitle}</td>
                    <td>{review.category}</td>
                    <td>
                      <button type="button" className="table-button" onClick={() => edit(review)}>Sửa</button>
                      <button type="button" className="table-button danger" onClick={() => remove(review)}>Xóa</button>
                    </td>
                  </tr>
                ))}
                {!reviews.length && <tr><td colSpan="4">Chưa có bài đánh giá nào.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewManagementPage;
