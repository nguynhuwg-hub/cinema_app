import { useEffect, useState } from 'react';
import { movieApi } from '../../movie/api/movieApi';
import { cinemaApi, hallApi } from '../../cinema/api/cinemaApi';
import { showtimeApi } from '../../showtime/api/showtimeApi';

const ShowtimeManagementPage = () => {
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [halls, setHalls] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [form, setForm] = useState({ movieId: '', cinemaId: '', hallId: '', startTime: '', endTime: '', basePrice: '' });
  const load = () => showtimeApi.getAll().then(setShowtimes);
  useEffect(() => { movieApi.getAll().then(setMovies); cinemaApi.getAll().then(setCinemas); load(); }, []);
  const setField = (name, value) => setForm({ ...form, [name]: value });
  const cinemaChanged = (value) => { setForm({ ...form, cinemaId: value, hallId: '' }); hallApi.getByCinema(value).then(setHalls); };
  const submit = async (event) => { event.preventDefault(); await showtimeApi.create({ movieId: Number(form.movieId), hallId: Number(form.hallId), startTime: form.startTime, endTime: form.endTime, basePrice: Number(form.basePrice) }); setForm({ movieId: '', cinemaId: '', hallId: '', startTime: '', endTime: '', basePrice: '' }); load(); };
  return <div className="admin-page"><div className="admin-page-heading"><p className="eyebrow">SCHEDULE CONTROL</p><h1>Quản lý suất chiếu</h1></div><div className="admin-split"><form className="admin-form compact" onSubmit={submit}><h2>Tạo suất chiếu</h2><select value={form.movieId} onChange={(e) => setField('movieId', e.target.value)} required><option value="">Chọn phim</option>{movies.map((movie) => <option value={movie.id} key={movie.id}>{movie.title}</option>)}</select><select value={form.cinemaId} onChange={(e) => cinemaChanged(e.target.value)} required><option value="">Chọn cụm rạp</option>{cinemas.map((cinema) => <option value={cinema.id} key={cinema.id}>{cinema.name}</option>)}</select><select value={form.hallId} onChange={(e) => setField('hallId', e.target.value)} required><option value="">Chọn phòng</option>{halls.map((hall) => <option value={hall.id} key={hall.id}>{hall.name}</option>)}</select><div className="form-grid"><label>Bắt đầu<input type="datetime-local" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} required /></label><label>Kết thúc<input type="datetime-local" value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} required /></label></div><input type="number" min="1" placeholder="Giá vé" value={form.basePrice} onChange={(e) => setField('basePrice', e.target.value)} required /><button className="primary-button">Tạo suất chiếu</button></form><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Phim</th><th>Phòng</th><th>Bắt đầu</th><th>Giá</th><th /></tr></thead><tbody>{showtimes.map((showtime) => <tr key={showtime.id}><td>{showtime.movieTitle}</td><td>{showtime.hallName}</td><td>{new Date(showtime.startTime).toLocaleString('vi-VN')}</td><td>{showtime.basePrice?.toLocaleString('vi-VN')} đ</td><td><button className="table-button danger" onClick={() => showtimeApi.remove(showtime.id).then(load)}>Xóa</button></td></tr>)}</tbody></table></div></div></div>;
};
export default ShowtimeManagementPage;