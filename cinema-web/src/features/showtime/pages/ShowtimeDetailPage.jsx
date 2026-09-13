import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { showtimeApi } from '../api/showtimeApi';
import { useAuth } from '../../../context/AuthContext';

const ShowtimeDetailPage = () => {
  const { id } = useParams();
  const [showtime, setShowtime] = useState(null);
  const [layout, setLayout] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holding, setHolding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useAuth();

  const loadLayout = () => showtimeApi.getSeats(id).then(setLayout);
  useEffect(() => { Promise.all([showtimeApi.getById(id), showtimeApi.getSeats(id)]).then(([showtimeData, layoutData]) => { setShowtime(showtimeData); setLayout(layoutData); }).catch(() => setError('Không thể tải sơ đồ ghế.')); }, [id]);

  if (error) return <div className="page-shell"><p className="form-error">{error}</p></div>;
  if (!showtime) return <div className="page-shell"><p className="muted">Đang tải sơ đồ ghế...</p></div>;

  const seats = layout?.seats || layout?.showtimeSeats || [];
  const selectedDetails = seats.filter((seat) => selectedSeats.includes(seat.id));
  const totalPrice = selectedDetails.reduce((total, seat) => total + Number(showtime.basePrice || 0) * (seat.seatType === 'VIP' ? 1.2 : seat.seatType === 'COUPLE' ? 2 : 1), 0);
  const toggleSeat = (seat) => { if (seat.status !== 'AVAILABLE' || holding) return; setMessage(''); setSelectedSeats((current) => current.includes(seat.id) ? current.filter((seatId) => seatId !== seat.id) : [...current, seat.id]); };
  const holdSeats = async () => {
    if (!selectedSeats.length) { setMessage('Hãy chọn ít nhất một ghế.'); return; }
    if (!isAuthenticated || !user?.id) { setMessage('Hãy nạp access token từ Postman trước khi giữ ghế.'); return; }
    setHolding(true); setMessage('');
    try { await showtimeApi.updateSeatStatus(id, { showtimeSeatIds: selectedSeats, status: 'HELD', userId: user.id }); await loadLayout(); setSelectedSeats([]); setMessage('Đã giữ ghế trong 10 phút.'); } catch (requestError) { setMessage(requestError.response?.data?.message || 'Không thể giữ ghế. Ghế có thể vừa được người khác chọn.'); await loadLayout().catch(() => null); } finally { setHolding(false); }
  };

  return <div className="page-shell"><Link className="back-link" to={`/movies/${showtime.movieId}`}>← Quay lại phim</Link><section className="section-heading"><div><p className="eyebrow">{showtime.movieTitle}</p><h1>{showtime.hallName}</h1><p className="muted">{new Date(showtime.startTime).toLocaleString('vi-VN')} · {showtime.basePrice?.toLocaleString('vi-VN')} đ/vé</p></div><div className="availability">{showtime.availableSeats ?? layout?.availableSeats ?? '—'}<span>ghế trống</span></div></section><div className="seat-panel"><div className="screen-label">MÀN HÌNH</div><div className="seat-grid">{seats.map((seat) => <button type="button" className={`seat seat-${String(seat.status || 'AVAILABLE').toLowerCase()} seat-${String(seat.seatType || '').toLowerCase()} ${selectedSeats.includes(seat.id) ? 'seat-selected' : ''}`} key={seat.id} disabled={seat.status !== 'AVAILABLE'} onClick={() => toggleSeat(seat)}>{seat.seatNumber || seat.seatName || seat.id}</button>)}</div>{!seats.length && <p className="muted">Sơ đồ ghế chưa được thiết lập.</p>}<div className="seat-legend"><span><i className="legend available" />Trống</span><span><i className="legend unavailable" />Đã chọn/khóa</span><span><i className="legend legend-vip" />VIP</span><span><i className="legend legend-couple" />Couple</span></div><div className="seat-booking-bar"><div><strong>{selectedSeats.length} ghế đã chọn</strong><span>{totalPrice.toLocaleString('vi-VN')} đ</span></div><button className="primary-button" type="button" disabled={holding || !selectedSeats.length} onClick={holdSeats}>{holding ? 'Đang giữ ghế...' : 'Xác nhận giữ ghế'}</button></div>{message && <p className={message.startsWith('Đã') ? 'form-success' : 'form-error'}>{message}</p>}</div></div>;
};

export default ShowtimeDetailPage;
