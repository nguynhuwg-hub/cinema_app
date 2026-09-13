import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cinemaApi, cityApi, hallApi, seatApi } from '../../cinema/api/cinemaApi';
import { showtimeApi } from '../../showtime/api/showtimeApi';

const emptyCinema = { name: '', address: '', description: '', cityId: '' };
const emptyHall = { name: '', totalRows: 8, seatsPerRow: 10 };

const CinemaManagementPage = () => {
  const [cinemas, setCinemas] = useState([]);
  const [cities, setCities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [halls, setHalls] = useState([]);
  const [seats, setSeats] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [form, setForm] = useState(emptyCinema);
  const [hallForm, setHallForm] = useState(emptyHall);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCinemas = () => cinemaApi.getAll().then(setCinemas).catch(() => setError('Không thể tải danh sách cụm rạp.'));

  useEffect(() => {
    loadCinemas();
    cityApi.getAll().then(setCities).catch(() => setError('Không thể tải danh sách thành phố.'));
  }, []);

  const selectCinema = async (cinema) => {
    setSelected(cinema);
    setSeats([]);
    setError('');
    try {
      const [hallData, showtimeData] = await Promise.all([
        hallApi.getByCinema(cinema.id),
        showtimeApi.getAll({ cinemaId: cinema.id }),
      ]);
      setHalls(hallData || []);
      setShowtimes(showtimeData || []);
    } catch {
      setError('Không thể tải phòng chiếu hoặc suất chiếu của cụm rạp.');
    }
  };

  const submitCinema = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await cinemaApi.create({ ...form, cityId: Number(form.cityId) });
      setForm(emptyCinema);
      await loadCinemas();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tạo cụm rạp.');
    } finally {
      setLoading(false);
    }
  };

  const removeCinema = async (cinema) => {
    if (!window.confirm(`Xóa cụm rạp "${cinema.name}"?`)) return;
    setError('');
    try {
      await cinemaApi.remove(cinema.id);
      if (selected?.id === cinema.id) {
        setSelected(null);
        setHalls([]);
        setShowtimes([]);
        setSeats([]);
      }
      await loadCinemas();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa cụm rạp. Có thể rạp đang có phòng hoặc suất chiếu.');
    }
  };

  const submitHall = async (event) => {
    event.preventDefault();
    try {
      await hallApi.create({
        ...hallForm,
        cinemaId: selected.id,
        totalRows: Number(hallForm.totalRows),
        seatsPerRow: Number(hallForm.seatsPerRow),
      });
      setHallForm(emptyHall);
      setHalls(await hallApi.getByCinema(selected.id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tạo phòng chiếu.');
    }
  };

  const loadSeats = (hallId) => seatApi.getByHall(hallId).then(setSeats).catch(() => setError('Không thể tải sơ đồ ghế.'));

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <p className="eyebrow">VENUE OPERATIONS</p>
        <h1>Cụm rạp & phòng chiếu</h1>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="admin-split">
        <div>
          <form className="admin-form compact" onSubmit={submitCinema}>
            <h2>Thêm cụm rạp</h2>
            <input placeholder="Tên cụm rạp" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <input placeholder="Địa chỉ" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
            <textarea placeholder="Mô tả" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            <select value={form.cityId} onChange={(event) => setForm({ ...form, cityId: event.target.value })} required>
              <option value="">Chọn thành phố</option>
              {cities.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}
            </select>
            <button className="primary-button" disabled={loading}>{loading ? 'Đang lưu...' : 'Tạo cụm rạp'}</button>
          </form>
          <div className="admin-list">
            {cinemas.map((cinema) => (
              <div className={`admin-list-item ${selected?.id === cinema.id ? 'selected' : ''}`} key={cinema.id}>
                <button className="cinema-select-button" onClick={() => selectCinema(cinema)}>
                  <strong>{cinema.name}</strong>
                  <span>{cinema.cityName} · {cinema.address}</span>
                </button>
                <button className="table-button danger" onClick={() => removeCinema(cinema)}>Xóa</button>
              </div>
            ))}
          </div>
        </div>

        {selected ? (
          <div className="admin-form compact">
            <p className="eyebrow">{selected.cityName}</p>
            <h2>{selected.name}</h2>
            <form onSubmit={submitHall} className="stack-form">
              <input placeholder="Tên phòng" value={hallForm.name} onChange={(event) => setHallForm({ ...hallForm, name: event.target.value })} required />
              <div className="form-grid">
                <input type="number" min="1" placeholder="Số hàng" value={hallForm.totalRows} onChange={(event) => setHallForm({ ...hallForm, totalRows: event.target.value })} />
                <input type="number" min="1" placeholder="Ghế mỗi hàng" value={hallForm.seatsPerRow} onChange={(event) => setHallForm({ ...hallForm, seatsPerRow: event.target.value })} />
              </div>
              <button className="primary-button">Tạo phòng chiếu</button>
            </form>
            <div className="hall-list">
              {halls.map((hall) => (
                <article key={hall.id}>
                  <strong>{hall.name}</strong>
                  <span>{hall.totalSeats} ghế</span>
                  <button className="table-button" onClick={() => loadSeats(hall.id)}>Xem ghế</button>
                </article>
              ))}
            </div>
            {showtimes.length > 0 && (
              <section className="cinema-showtimes">
                <div className="subsection-heading"><h3>Suất chiếu tại rạp</h3><span>{showtimes.length} suất</span></div>
                <div className="showtime-admin-list">
                  {showtimes.map((showtime) => (
                    <Link to={`/showtimes/${showtime.id}`} className="showtime-admin-item" key={showtime.id}>
                      <strong>{new Date(showtime.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>
                      <span>{showtime.movieTitle}</span>
                      <small>{showtime.hallName} · Xem ghế →</small>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            {seats.length > 0 && <div className="seat-admin-grid">{seats.map((seat) => <select key={seat.id} value={seat.seatType} onChange={(event) => seatApi.updateType(seat.id, { seatType: event.target.value }).then(() => loadSeats(seat.hallId))}><option value="NORMAL">{seat.fullSeatName} · Thường</option><option value="VIP">{seat.fullSeatName} · VIP</option><option value="COUPLE">{seat.fullSeatName} · Couple</option></select>)}</div>}
          </div>
        ) : <div className="empty-state">Chọn một cụm rạp để quản lý phòng chiếu và suất chiếu.</div>}
      </div>
    </div>
  );
};

export default CinemaManagementPage;
