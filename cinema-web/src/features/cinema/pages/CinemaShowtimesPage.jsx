import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { cinemaApi } from '../api/cinemaApi';
import { showtimeApi } from '../../showtime/api/showtimeApi';

const CinemaShowtimesPage = () => {
  const { id } = useParams();
  const [cinema, setCinema] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([cinemaApi.getById(id), showtimeApi.getAll({ cinemaId: id })])
      .then(([cinemaData, showtimeData]) => { setCinema(cinemaData); setShowtimes(showtimeData || []); })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Không thể tải suất chiếu của cụm rạp.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-shell"><p className="muted">Đang tải suất chiếu...</p></div>;
  if (error) return <div className="page-shell"><p className="form-error">{error}</p></div>;

  return <div className="page-shell cinema-showtimes-page"><Link className="back-link" to="/cinemas">← Tất cả cụm rạp</Link><section className="section-heading"><div><p className="eyebrow">{cinema?.cityName || 'CINEFLIX'}</p><h1>{cinema?.name || 'Suất chiếu'}</h1><p className="muted">{cinema?.address}</p></div><span className="showtime-count">{showtimes.length} suất chiếu</span></section>{showtimes.length === 0 ? <p className="muted">Cụm rạp này hiện chưa có suất chiếu.</p> : <div className="showtime-list cinema-showtime-grid">{showtimes.map((showtime) => <Link to={`/showtimes/${showtime.id}`} className="showtime-item" key={showtime.id}><strong>{new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong><span>{showtime.movieTitle}</span><span>{showtime.hallName}</span><small>{new Date(showtime.startTime).toLocaleDateString('vi-VN')} · {showtime.basePrice?.toLocaleString('vi-VN')} đ</small><em>Xem ghế →</em></Link>)}</div>}</div>;
};

export default CinemaShowtimesPage;
