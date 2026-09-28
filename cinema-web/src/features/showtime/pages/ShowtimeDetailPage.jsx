import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { showtimeApi } from '../api/showtimeApi';
import { useAuth } from '../../../context/AuthContext';

const HOLD_DURATION_SECONDS = 15 * 60; // 15 phút

const ShowtimeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [showtime, setShowtime] = useState(null);
  const [layout, setLayout] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holding, setHolding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Quản lý đếm ngược giữ ghế
  const [holdTimer, setHoldTimer] = useState(null);
  const [isHeld, setIsHeld] = useState(false);

  const loadLayout = () => showtimeApi.getSeats(id).then(setLayout);

  useEffect(() => {
    Promise.all([showtimeApi.getById(id), showtimeApi.getSeats(id)])
      .then(([showtimeData, layoutData]) => {
        setShowtime(showtimeData);
        setLayout(layoutData);
      })
      .catch(() => setError('Không thể tải sơ đồ ghế.'));
  }, [id]);

  // Clock đếm ngược 15 phút khi giữ ghế thành công
  useEffect(() => {
    let interval = null;
    if (isHeld && holdTimer > 0) {
      interval = setInterval(() => {
        setHoldTimer((prev) => prev - 1);
      }, 1000);
    } else if (holdTimer === 0 && isHeld) {
      setIsHeld(false);
      setSelectedSeats([]);
      setMessage('Thời gian giữ ghế đã hết. Vui lòng chọn lại!');
      loadLayout();
    }
    return () => clearInterval(interval);
  }, [holdTimer, isHeld]);

  if (error) return <div className="page-shell"><p className="form-error">{error}</p></div>;
  if (!showtime) return <div className="page-shell"><p className="muted">Đang tải sơ đồ ghế...</p></div>;

  const seats = layout?.seats || layout?.showtimeSeats || [];
  const selectedDetails = seats.filter((seat) => selectedSeats.includes(seat.id));

  const totalPrice = selectedDetails.reduce(
    (total, seat) =>
      total + Number(showtime.basePrice || 0) * (seat.seatType === 'VIP' ? 1.2 : seat.seatType === 'COUPLE' ? 2 : 1),
    0
  );

  const toggleSeat = (seat) => {
    // Không cho chọn lại nếu đã giữ ghế thành công hoặc ghế bị khóa/bán
    if (seat.status !== 'AVAILABLE' || holding || isHeld) return;
    setMessage('');
    setSelectedSeats((current) =>
      current.includes(seat.id) ? current.filter((seatId) => seatId !== seat.id) : [...current, seat.id]
    );
  };

  const holdSeats = async () => {
    if (!selectedSeats.length) {
      setMessage('Hãy chọn ít nhất một ghế.');
      return;
    }

    if (!isAuthenticated) {
      setMessage('Vui lòng đăng nhập để thực hiện đặt giữ ghế.');
      return;
    }

    setHolding(true);
    setMessage('');

    try {
      // Chỉ gửi danh sách ID ghế và status HELD (không gửi userId)
      await showtimeApi.updateSeatStatus(id, {
        showtimeSeatIds: selectedSeats,
        status: 'HELD'
      });

      await loadLayout();
      setIsHeld(true);
      setHoldTimer(HOLD_DURATION_SECONDS);
      setMessage('Đã giữ ghế thành công trong 15 phút!');
    } catch (requestError) {
      setMessage(
        requestError.response?.data?.message || 'Không thể giữ ghế. Ghế có thể vừa được người khác chọn.'
      );
      await loadLayout().catch(() => null);
    } finally {
      setHolding(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page-shell">
      <Link className="back-link" to={`/movies/${showtime.movieId}`}>← Quay lại phim</Link>

      <section className="section-heading">
        <div>
          <p className="eyebrow">{showtime.movieTitle}</p>
          <h1>{showtime.hallName}</h1>
          <p className="muted">
            {new Date(showtime.startTime).toLocaleString('vi-VN')} · {showtime.basePrice?.toLocaleString('vi-VN')} đ/vé
          </p>
        </div>
        <div className="availability">
          {showtime.availableSeats ?? layout?.availableSeats ?? '—'}
          <span>ghế trống</span>
        </div>
      </section>

      <div className="seat-panel">
        <div className="screen-label">MÀN HÌNH</div>

        <div className="seat-grid">
          {seats.map((seat) => (
            <button
              type="button"
              className={`seat seat-${String(seat.status || 'AVAILABLE').toLowerCase()} seat-${String(
                seat.seatType || ''
              ).toLowerCase()} ${selectedSeats.includes(seat.id) ? 'seat-selected' : ''}`}
              key={seat.id}
              disabled={seat.status !== 'AVAILABLE' && !selectedSeats.includes(seat.id)}
              onClick={() => toggleSeat(seat)}
            >
              {seat.seatNumber || seat.seatName || seat.id}
            </button>
          ))}
        </div>

        {!seats.length && <p className="muted">Sơ đồ ghế chưa được thiết lập.</p>}

        <div className="seat-legend">
          <span><i className="legend available" />Trống</span>
          <span><i className="legend unavailable" />Đã chọn/khóa</span>
          <span><i className="legend legend-vip" />VIP</span>
          <span><i className="legend legend-couple" />Couple</span>
        </div>

        <div className="seat-booking-bar">
          <div>
            <strong>{selectedSeats.length} ghế đã chọn</strong>
            <span>{totalPrice.toLocaleString('vi-VN')} đ</span>
            {isHeld && holdTimer > 0 && (
              <p className="hold-timer" style={{ color: '#e53e3e', marginTop: '4px' }}>
                Giữ ghế còn lại: <strong>{formatTime(holdTimer)}</strong>
              </p>
            )}
          </div>

          {!isHeld ? (
            <button
              className="primary-button"
              type="button"
              disabled={holding || !selectedSeats.length}
              onClick={holdSeats}
            >
              {holding ? 'Đang giữ ghế...' : 'Xác nhận giữ ghế'}
            </button>
          ) : (
            <button
              className="primary-button checkout-button"
              type="button"
              onClick={() => navigate(`/checkout/${id}`, { state: { selectedSeats, totalPrice } })}
            >
              Thanh toán ngay
            </button>
          )}
        </div>

        {message && (
          <p className={message.startsWith('Đã') ? 'form-success' : 'form-error'}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default ShowtimeDetailPage;