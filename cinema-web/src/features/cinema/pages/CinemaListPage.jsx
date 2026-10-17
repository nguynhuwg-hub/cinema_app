import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cinemaApi, cityApi } from '../api/cinemaApi';
import './CinemaListPage.css';

const CinemaListPage = () => {
  const [cinemas, setCinemas] = useState([]);
  const [cities, setCities] = useState([]);
  const [cityId, setCityId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cityApi.getAll()
      .then(setCities)
      .catch(() => setError('Không thể tải danh sách thành phố. Hãy kiểm tra backend.'));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    const request = cityId ? cinemaApi.getByCity(cityId) : cinemaApi.getAll();
    
    request
      .then(setCinemas)
      .catch(() => {
        setCinemas([]);
        setError('Không thể tải danh sách cụm rạp. Hãy kiểm tra backend đang chạy ở cổng 8080.');
      })
      .finally(() => setLoading(false));
  }, [cityId]);

  return (
    <div className="page-shell cinema-directory">
      <section className="cinema-directory-hero">
        <div className="cinema-directory-copy">
          <p className="eyebrow">ĐIỂM HẸN ĐIỆN ẢNH CỦA BẠN</p>
          <h1>Màn ảnh lớn,<br /><span>ngay gần bạn.</span></h1>
          <p>Chọn cụm rạp phù hợp, khám phá lịch chiếu và chuẩn bị cho buổi xem phim tiếp theo.</p>
        </div>
        <div className="cinema-city-filter">
          <span className="cinema-city-icon" aria-hidden="true">⌖</span>
          <label htmlFor="cinema-city">CHỌN KHU VỰC</label>
          <select
            id="cinema-city"
            value={cityId}
            onChange={(event) => setCityId(event.target.value)}
          >
            <option value="">Tất cả thành phố</option>
            {cities.map((city) => (
              <option value={city.id} key={city.id}>{city.name}</option>
            ))}
          </select>
          <span className="cinema-select-chevron" aria-hidden="true">⌄</span>
        </div>
      </section>

      <div className="cinema-list-heading">
        <div><p className="eyebrow">CINEF LOCATIONS</p><h2>Khám phá cụm rạp</h2></div>
        {!loading && !error && <span className="cinema-result-count">{cinemas.length} địa điểm</span>}
      </div>

      {error && <p className="form-error cinema-directory-error">{error}</p>}

      {loading && (
        <div className="cinema-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-card" />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="cinema-grid" key={cityId}>
          {cinemas.map((cinema) => (
            <article className="cinema-card" key={cinema.id}>
              <div className="cinema-card-mark" aria-hidden="true">C<span>F</span></div>
              <div>
                <p className="cinema-city-name"><span aria-hidden="true">⌖</span>{cinema.cityName || 'CINEF CINEMA'}</p>
                <h2>{cinema.name}</h2>
                <p className="cinema-address"><span aria-hidden="true">⌂</span>{cinema.address}</p>
                {cinema.description && <p className="cinema-description">{cinema.description}</p>}
              </div>
              <Link className="cinema-showtimes-link" to={`/cinemas/${cinema.id}/showtimes`}>
                <span>Xem lịch chiếu</span><span className="arrow" aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && cinemas.length === 0 && (
        <div className="cinema-empty-state"><span aria-hidden="true">⌖</span><h3>Chưa có rạp ở khu vực này</h3><p>Hãy chọn thành phố khác để khám phá các cụm rạp CineF.</p></div>
      )}
    </div>
  );
};

export default CinemaListPage;