import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cinemaApi, cityApi } from '../api/cinemaApi';

const CinemaListPage = () => {
  const [cinemas, setCinemas] = useState([]);
  const [cities, setCities] = useState([]);
  const [cityId, setCityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { cityApi.getAll().then(setCities).catch(() => setError('Không thể tải danh sách thành phố. Hãy kiểm tra backend.')); }, []);
  useEffect(() => { setLoading(true); setError(''); const request = cityId ? cinemaApi.getByCity(cityId) : cinemaApi.getAll(); request.then(setCinemas).catch(() => { setCinemas([]); setError('Không thể tải danh sách cụm rạp. Hãy kiểm tra backend đang chạy ở cổng 8080.'); }).finally(() => setLoading(false)); }, [cityId]);

  return <div className="page-shell"><section className="section-heading"><div><p className="eyebrow">HỆ THỐNG RẠP</p><h1>Tìm rạp gần bạn</h1></div><select className="search-input" value={cityId} onChange={(event) => setCityId(event.target.value)}><option value="">Tất cả thành phố</option>{cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}</select></section>{loading && <p className="muted">Đang tải rạp...</p>}{error && <p className="form-error">{error}</p>}{!loading && !error && <div className="cinema-grid">{cinemas.map((cinema) => <article className="cinema-card" key={cinema.id}><p className="eyebrow">{cinema.cityName || 'CINEMA'}</p><h2>{cinema.name}</h2><p>{cinema.address}</p>{cinema.description && <p className="muted">{cinema.description}</p>}<Link className="outline-button cinema-showtimes-link" to={`/cinemas/${cinema.id}/showtimes`}>Xem suất chiếu →</Link></article>)}</div>}{!loading && !error && cinemas.length === 0 && <p className="muted">Chưa có cụm rạp.</p>}</div>;
};

export default CinemaListPage;