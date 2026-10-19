import { useEffect, useState } from 'react';
import { movieApi } from '../../movie/api/movieApi';
import { cinemaApi, hallApi } from '../../cinema/api/cinemaApi';
import { showtimeApi } from '../../showtime/api/showtimeApi';

const ShowtimeManagementPage = () => {
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [halls, setHalls] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ movieId: '', cinemaId: '', hallId: '', startTime: '', basePrice: '' });
  const load = async () => {
    const data = await showtimeApi.getAll();
    setShowtimes(data || []);
  };
  useEffect(() => {
    movieApi.getAll().then(setMovies).catch((requestError) => {
      setError(requestError.response?.data?.message || 'Không thể tải danh sách phim.');
    });
    cinemaApi.getAll().then(setCinemas).catch((requestError) => {
      setError(requestError.response?.data?.message || 'Không thể tải danh sách cụm rạp.');
    });
    load().catch((requestError) => {
      setError(requestError.response?.status === 403
        ? 'Không có quyền xem danh sách suất chiếu (SHOWTIME_READ). Việc này khác với quyền tạo suất.'
        : requestError.response?.data?.message || 'Không thể tải danh sách suất chiếu.');
    });
  }, []);
  const setField = (name, value) => setForm({ ...form, [name]: value });
  const cinemaChanged = (value) => { setForm({ ...form, cinemaId: value, hallId: '' }); hallApi.getByCinema(value).then(setHalls); };
  const selectedMovie = movies.find((movie) => String(movie.id) === form.movieId);
  const calculatedEndTime = () => {
    if (!form.startTime || !selectedMovie?.durationMinutes) return '';
    const endTime = new Date(form.startTime);
    endTime.setMinutes(endTime.getMinutes() + selectedMovie.durationMinutes);
    const pad = (value) => String(value).padStart(2, '0');
    return `${endTime.getFullYear()}-${pad(endTime.getMonth() + 1)}-${pad(endTime.getDate())}T${pad(endTime.getHours())}:${pad(endTime.getMinutes())}`;
  };
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const formatDateTime = (dt) => (dt && dt.length === 16 ? `${dt}:00` : dt);
    try {
      await showtimeApi.create({
        movieId: Number(form.movieId),
        hallId: Number(form.hallId),
        startTime: formatDateTime(form.startTime),
        basePrice: Number(form.basePrice),
      });
    } catch (requestError) {
      const serverMessage = requestError.response?.data?.message;
      setError(requestError.response?.status === 403
        ? `Máy chủ từ chối tạo suất cho phòng ID ${form.hallId} (403). Quyền được kiểm tra trước khi xử lý phòng; nếu tài khoản tạo được phòng khác, hãy đối chiếu authorities của phiên đăng nhập trong log backend.${serverMessage ? ` Chi tiết: ${serverMessage}` : ''}`
        : requestError.response?.data?.message || 'Không thể tạo suất chiếu. Vui lòng kiểm tra thông tin và thử lại.');
      return;
    }

    setForm({ movieId: '', cinemaId: '', hallId: '', startTime: '', basePrice: '' });
    try {
      await load();
      setError('');
    } catch (requestError) {
      setError(requestError.response?.status === 403
        ? 'Đã tạo suất chiếu thành công, nhưng không tải lại được danh sách (GET /api/v1/showtimes trả 403). Cần quyền xem suất chiếu SHOWTIME_READ.'
        : requestError.response?.data?.message || 'Đã tạo suất chiếu, nhưng không tải lại được danh sách.');
    }
  };
  return <div className="admin-page">
    <div className="admin-page-heading">
      <p className="eyebrow">SCHEDULE CONTROL</p><h1>Quản lý suất chiếu</h1>
      </div>
    {error && <p className="form-error" role="alert">{error}</p>}
      <div className="admin-split">
        <form className="admin-form compact" onSubmit={submit}>
          <h2>Tạo suất chiếu</h2>
          <select value={form.movieId} onChange={(e) => setField('movieId', e.target.value)} required>
            <option value="">Chọn phim</option>
            {movies.map((movie) => <option value={movie.id} key={movie.id}>{movie.title}</option>)}
            </select>
            <select value={form.cinemaId} onChange={(e) => cinemaChanged(e.target.value)} required>
              <option value="">Chọn cụm rạp</option>
              {cinemas.map((cinema) => <option value={cinema.id} key={cinema.id}>{cinema.name}</option>)}
            </select>
            <select value={form.hallId} onChange={(e) => setField('hallId', e.target.value)} required>
              <option value="">Chọn phòng</option>
              {halls.map((hall) => <option value={hall.id} key={hall.id}>{hall.name}</option>)}
            </select>
            <div className="form-grid">
              <label>Bắt đầu
                <input type="datetime-local" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} required />
              </label>
              <label>Kết thúc (tự tính)
                <input type="datetime-local" value={calculatedEndTime()} readOnly required />
              </label>
            </div>
            <input type="number" min="1" placeholder="Giá vé" value={form.basePrice} onChange={(e) => setField('basePrice', e.target.value)} required />
            <button className="primary-button">Tạo suất chiếu</button>
          </form>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Phòng</th>
                  <th>Bắt đầu</th>
                  <th>Giá</th>
                  <th /></tr>
              </thead>
              <tbody>
                {showtimes.map((showtime) => (
                  <tr key={showtime.id}>
                    <td>{showtime.movieTitle}</td>
                    <td>{showtime.hallName}</td>
                    <td>{new Date(showtime.startTime).toLocaleString('vi-VN')}</td>
                    <td>{showtime.basePrice?.toLocaleString('vi-VN')} đ</td>
                    <td>
                      <button className="table-button danger" onClick={() => showtimeApi.remove(showtime.id).then(load)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>;

};
export default ShowtimeManagementPage;