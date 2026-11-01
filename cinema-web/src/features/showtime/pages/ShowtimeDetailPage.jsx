
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { showtimeApi } from '../api/showtimeApi';
import { bookingApi } from '../../booking/api/bookingApi';
import { useAuth } from '../../../context/AuthContext';
import { groupSeatsByRow } from '../../../utils/seatLayout';

export default function ShowtimeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [showtime, setShowtime] = useState(null);
  const [layout, setLayout] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [holding, setHolding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Tải thông tin suất chiếu và cập nhật ghế mỗi 5 giây
  useEffect(() => {
    let active = true;
    let loading = false;
    let firstLoad = true;

    const load = async () => {
      if (loading) return;

      loading = true;

      try {
        const [details, seats] = await Promise.all([
          showtimeApi.getById(id),
          showtimeApi.getSeats(id),
        ]);

        if (active) {
          if (firstLoad) {
            setSelectedSeats([]);
            firstLoad = false;
          }

          setShowtime(details);
          setLayout(seats);
          setError('');
        }
      } catch {
        if (active) {
          setError('Không thể tải sơ đồ ghế.');
        }
      } finally {
        loading = false;
      }
    };

    load();

    const poll = setInterval(load, 5000);

    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [id]);

  // Chọn hoặc bỏ chọn ghế
  const toggle = (seat) => {
    if (seat.status !== 'AVAILABLE' || holding) return;

    setMessage('');

    setSelectedSeats((current) =>
      current.includes(seat.seatId)
        ? current.filter((value) => value !== seat.seatId)
        : [...current, seat.seatId]
    );
  };

  // Tạo booking và chuyển đến trang thanh toán
  const reserve = async () => {
    if (!isAuthenticated) {
      setMessage('Vui lòng đăng nhập để đặt vé.');
      return;
    }

    if (holding || !selectedSeats.length) return;

    setHolding(true);
    setMessage('');

    try {
      const booking = await bookingApi.create({
        showtimeId: Number(id),
        seatIds: selectedSeats,
      });

      navigate(`/checkout/${booking.id}`);
    } catch (requestError) {
      setMessage(
        requestError.response?.data?.message ||
          'Không thể giữ ghế. Vui lòng kiểm tra lại sơ đồ.'
      );

      try {
        setLayout(await showtimeApi.getSeats(id));
      } catch {
        setError('Không thể cập nhật sơ đồ ghế.');
      }
    } finally {
      setHolding(false);
    }
  };

  // Trạng thái tải dữ liệu
  if (!showtime || !layout || showtime.id !== Number(id)) {
    return (
      <div className="page-shell">
        <p>{error || 'Đang tải sơ đồ ghế...'}</p>
      </div>
    );
  }

  // Danh sách ghế từ backend
  const seats = layout?.seats || layout?.showtimeSeats || [];

  // Nhóm ghế theo hàng để hiển thị giao diện mới
  const seatRows = groupSeatsByRow(seats);

  // Thông tin các ghế đã chọn
  const selectedDetails = seats.filter((seat) =>
    selectedSeats.includes(seat.seatId)
  );

  // Tổng tiền
  const total = selectedDetails.reduce(
    (sum, seat) => sum + Number(seat.price || 0),
    0
  );

  // Kiểm tra ghế đã chọn còn khả dụng không
  const staleSelection =
    selectedDetails.length !== selectedSeats.length ||
    selectedDetails.some(
      (seat) => seat.status !== 'AVAILABLE'
    );

  return (
    <div className="page-shell">
      {/* Quay lại trang phim */}
      <Link
        className="back-link"
        to={`/movies/${showtime.movieId}`}
      >
        ← Quay lại phim
      </Link>

      {/* Thông tin suất chiếu */}
      <section className="section-heading">
        <div>
          <p className="eyebrow">
            {showtime.movieTitle}
          </p>

          <h1>{showtime.hallName}</h1>

          <p className="muted">
            {new Date(showtime.startTime).toLocaleString('vi-VN')}
          </p>
        </div>

        <div className="availability">
          {layout.availableSeats}
          <span>ghế trống</span>
        </div>
      </section>

      {/* Sơ đồ ghế */}
      <div className="seat-panel">
        <div className="screen-label">
          MÀN HÌNH
        </div>

        <div
          className="seat-layout"
          aria-label="Sơ đồ ghế theo hàng"
        >
          {seatRows.map((row) => (
            <div
              className="seat-row"
              key={row.label}
            >
              <span className="seat-row-label">
                {row.label}
              </span>

              <div className="seat-row-items">
                {row.seats.map((seat) => {
                  const selected = selectedSeats.includes(
                    seat.seatId
                  );

                  const available =
                    seat.status === 'AVAILABLE';

                  const seatName =
                    seat.seatNumber ||
                    seat.seatName ||
                    seat.seatId;

                  return (
                    <button
                      type="button"
                      key={seat.seatId}
                      className={`seat seat-${String(
                        seat.status || 'AVAILABLE'
                      ).toLowerCase()} seat-${String(
                        seat.seatType || ''
                      ).toLowerCase()} ${
                        selected ? 'seat-selected' : ''
                      }`}
                      disabled={
                        holding ||
                        (!available && !selected)
                      }
                      title={`${seatName}: ${Number(
                        seat.price || 0
                      ).toLocaleString('vi-VN')} đ`}
                      aria-label={`Ghế ${seatName}, ${
                        available
                          ? 'còn trống'
                          : 'không khả dụng'
                      }`}
                      onClick={() => {
                        if (selected && !available) {
                          setSelectedSeats((current) =>
                            current.filter(
                              (value) =>
                                value !== seat.seatId
                            )
                          );
                        } else {
                          toggle(seat);
                        }
                      }}
                    >
                      {seatName}
                    </button>
                  );
                })}
              </div>

              <span className="seat-row-label seat-row-label-end">
                {row.label}
              </span>
            </div>
          ))}
        </div>

        {/* Không có ghế */}
        {!seats.length && (
          <p className="muted">
            Sơ đồ ghế chưa được thiết lập.
          </p>
        )}

        {/* Chú thích trạng thái ghế */}
        <div className="seat-legend">
          <span>
            <i className="legend available" />
            Trống
          </span>

          <span>
            <i className="legend unavailable" />
            Đang giữ/đã bán
          </span>

          <span>
            <i className="legend legend-vip" />
            VIP
          </span>

          <span>
            <i className="legend legend-couple" />
            Couple
          </span>
        </div>

        {/* Thanh thông tin đặt vé */}
        <div className="seat-booking-bar">
          <div>
            <strong>
              {selectedSeats.length} ghế đã chọn
            </strong>

            <span>
              {total.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <button
            type="button"
            className="primary-button"
            disabled={
              holding ||
              !selectedSeats.length ||
              staleSelection
            }
            onClick={reserve}
          >
            {holding
              ? 'Đang tạo đơn...'
              : 'Giữ ghế và tiếp tục'}
          </button>
        </div>

        {/* Thời gian giữ ghế */}
        <p className="muted">
          Ghế được giữ tối đa 10 phút sau khi tạo đơn,
          hoặc đến khi suất chiếu bắt đầu.
          Giá thanh toán do hệ thống xác nhận.
        </p>

        {/* Ghế đã bị người khác giữ */}
        {staleSelection && (
          <p className="form-error">
            Một số ghế đã được người khác giữ.
            Hãy bỏ chọn và chọn lại.
          </p>
        )}

        {/* Thông báo lỗi */}
        {(message || error) && (
          <p className="form-error" role="alert">
            {message || error}
          </p>
        )}
      </div>
    </div>
  );
}
