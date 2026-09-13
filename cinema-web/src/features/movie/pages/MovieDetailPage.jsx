import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { movieApi } from '../api/movieApi';
import { showtimeApi } from '../../showtime/api/showtimeApi';
import { commentApi } from '../api/movieApi';

const MovieDetailPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [error, setError] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    Promise.all([movieApi.getById(id), showtimeApi.getAll({ movieId: id }), commentApi.getAll(id)])
      .then(([movieData, showtimeData, commentData]) => { setMovie(movieData); setShowtimes(showtimeData || []); setComments(commentData || []); })
      .catch(() => setError('Không thể tải thông tin phim.'));
  }, [id]);

  if (error) return <div className="page-shell"><p className="form-error">{error}</p></div>;
  if (!movie) return <div className="page-shell"><p className="muted">Đang tải thông tin phim...</p></div>;
  return <div className="page-shell"><Link className="back-link" to="/">← Tất cả phim</Link><section className="movie-detail"><div className="detail-poster">{movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} /> : <span>NO POSTER</span>}</div><div className="detail-copy"><p className="eyebrow">{movie.status || 'ĐANG CHIẾU'}</p><h1>{movie.title}</h1><p className="detail-meta">{movie.releaseDate || 'Chưa công bố'} · {movie.durationMinutes} phút · {movie.language || 'Đang cập nhật'}</p><p>{movie.description || 'Thông tin mô tả đang được cập nhật.'}</p><div className="genre-list">{movie.genres?.map((genre) => <span key={genre.id}>{genre.name}</span>)}</div><div className="rating-large">★ {movie.avgRating ? Number(movie.avgRating).toFixed(1) : '—'}</div>{movie.trailerUrl && <a className="hero-button" href={movie.trailerUrl} target="_blank" rel="noreferrer">Xem trailer</a>}</div></section><section className="showtime-section"><p className="eyebrow">LỊCH CHIẾU</p><h2>Chọn suất chiếu</h2>{showtimes.length ? <div className="showtime-list">{showtimes.map((showtime) => <Link to={`/showtimes/${showtime.id}`} className="showtime-item" key={showtime.id}><strong>{new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong><span>{showtime.hallName}</span><small>{showtime.basePrice?.toLocaleString('vi-VN')} đ</small></Link>)}</div> : <p className="muted">Chưa có suất chiếu cho phim này.</p>}</section><section className="comments-section"><p className="eyebrow">CỘNG ĐỒNG CINEFLIX</p><h2>Đánh giá & bình luận</h2>{comments.map((comment) => <article className="comment-item" key={comment.id}><div><strong>{comment.userName || 'Khán giả'}</strong><span className="comment-rating">{'★'.repeat(comment.rating || 0)}</span></div><p>{comment.content}</p><small>{comment.createdAt ? new Date(comment.createdAt).toLocaleString('vi-VN') : ''}</small></article>)}</section></div>;
};

export default MovieDetailPage;