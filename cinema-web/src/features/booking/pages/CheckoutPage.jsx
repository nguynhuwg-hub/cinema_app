import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router-dom';

import { bookingApi } from '../api/bookingApi';
import { useAuth } from '../../../context/AuthContext';

const money = (value) =>
  Number(value || 0).toLocaleString('vi-VN') + ' đ';

const labels = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Đã hết hạn',
};

const getErrorMessage = (error, fallback) => {
  const status = error.response?.status;

  if (status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (status === 403) {
    return 'Backend từ chối xác minh thanh toán (403). Cần kiểm tra quyền truy cập API /verify.';
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.detail ||
    fallback
  );
};

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Lấy dữ liệu đồ ăn, coupon và tổng tiền được truyền từ ServicesPage qua state
  const serviceState = location.state || {};
  const cartItems = serviceState.cartItems || [];
  const foodTotal = serviceState.foodTotal || 0;
  const discountAmount = serviceState.discountAmount || 0;
  const appliedCoupon = serviceState.appliedCoupon || null;
  const passedSeatPrice = serviceState.totalSeatPrice || 0;
  const passedGrandTotal = serviceState.grandTotal || 0;

  // Khóa thao tác thủ công và chia sẻ request đang chạy.
  const verifyingRef = useRef(false);
  const inFlightVerifyRef = useRef(null);

  const returnedFromVnpay =
    searchParams.get('vnpay') === 'returned';

  // Tải trạng thái booking và cập nhật định kỳ.
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let active = true;
    let loading = false;

    const load = async () => {
      if (loading) return;

      loading = true;

      try {
        const data = await bookingApi.getById(id);

        if (!active) return;

        setBooking(data);

        // Chỉ chuyển sang trang vé khi backend đã xác nhận PAID.
        if (data.status === 'PAID') {
          navigate(`/tickets/${id}`, { replace: true });
        }
      } catch (requestError) {
        if (active) {
          setError(
            getErrorMessage(
              requestError,
              'Không thể tải đơn đặt vé.'
            )
          );
        }
      } finally {
        loading = false;
      }
    };

    load();

    const poll = setInterval(load, 5000);

    const clock = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      active = false;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [id, isAuthenticated, navigate]);

  // Chia sẻ cùng một Promise giữa các lần chạy Effect (kể cả StrictMode).
  const verifyPaymentOnce = useCallback(() => {
    if (inFlightVerifyRef.current?.id === id) {
      return inFlightVerifyRef.current.promise;
    }

    setVerifying(true);
    setError('');

    const promise = (async () => {
      await bookingApi.verifyPayment(id);
      return bookingApi.getById(id);
    })();

    inFlightVerifyRef.current = { id, promise };

    promise.then(
      () => {
        if (inFlightVerifyRef.current?.promise === promise) {
          inFlightVerifyRef.current = null;
          setVerifying(false);
        }
      },
      () => {
        if (inFlightVerifyRef.current?.promise === promise) {
          inFlightVerifyRef.current = null;
          setVerifying(false);
        }
      }
    );

    return promise;
  }, [id]);

  const applyVerifyResult = useCallback((data) => {
    setBooking(data);
    if (data.status === 'PAID') {
      navigate(`/tickets/${id}`, { replace: true });
      return;
    }
    setError(
      data.paymentReviewRequired
        ? 'Giao dịch cần đối soát. Vé chưa được cấp.'
        : 'Chưa xác nhận được thanh toán. Bạn có thể kiểm tra lại.'
    );
  }, [id, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !returnedFromVnpay) return undefined;

    let active = true;
    verifyPaymentOnce().then(
      (data) => {
        if (active) applyVerifyResult(data);
      },
      (requestError) => {
        if (active) {
          setError(getErrorMessage(requestError, 'Không thể xác minh thanh toán với VNPay.'));
        }
      }
    );

    return () => {
      active = false;
    };
  }, [isAuthenticated, returnedFromVnpay, verifyPaymentOnce, applyVerifyResult]);

  const verifyAgain = async () => {
    if (busy || verifyingRef.current) return;
    verifyingRef.current = true;
    try {
      const data = await verifyPaymentOnce();
      applyVerifyResult(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể kiểm tra giao dịch.'));
    } finally {
      verifyingRef.current = false;
    }
  };

  const pay = async () => {
    if (busy || verifying) return;

    setBusy(true);
    setError('');

    try {
      const result = await bookingApi.paymentUrl(id);

      const destination = new URL(result.paymentUrl);

      if (destination.protocol !== 'https:') {
        throw new Error('URL thanh toán không hợp lệ.');
      }

      window.location.assign(destination.href);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          requestError.message || 'Không thể mở VNPay.'
        )
      );

      setBusy(false);
    }
  };

  const cancel = async () => {
    if (
      !window.confirm(
        'Hủy đơn và nhả các ghế đang giữ?'
      )
    ) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const data = await bookingApi.cancel(id);
      setBooking(data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Không thể hủy đơn.'
        )
      );
    } finally {
      setBusy(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="page-shell">
        <p>
          Vui lòng{' '}
          <Link to="/login">đăng nhập</Link>
          {' '}để xem đơn đặt vé.
        </p>
      </div>
    );
  }

  if (!booking || booking.id !== Number(id)) {
    return (
      <div className="page-shell">
        <p className={error ? 'form-error' : 'muted'}>
          {error || 'Đang tải đơn đặt vé...'}
        </p>
      </div>
    );
  }

  const seconds = Math.max(
    0,
    Math.ceil(
      (Date.parse(booking.holdExpiresAt) - now) / 1000
    )
  );

  // Tính toán tiền vé, tiền đồ ăn và tổng tiền cuối cùng
  const seatTotal = passedSeatPrice || booking.totalAmount || 0;
  const computedGrandTotal = passedGrandTotal > 0 ? passedGrandTotal : (seatTotal + foodTotal);

  return (
    <div className="page-shell">
      <Link
        className="back-link"
        to={`/showtimes/${booking.showtimeId}`}
      >
        ← Xem suất chiếu
      </Link>

      <section className="section-heading">
        <div>
          <p className="eyebrow">
            ĐƠN BK-{booking.id}
          </p>

          <h1>{booking.movieTitle}</h1>

          <p>
            {booking.hallName} ·{' '}
            {new Date(
              booking.startTime
            ).toLocaleString('vi-VN')}
          </p>
        </div>

        <strong>
          {labels[booking.status] || booking.status}
        </strong>
      </section>

      <div className="admin-form">
        <h2>Ghế và giá vé</h2>

        {booking.seats?.map((seat) => (
          <p key={seat.seatId}>
            <strong>{seat.seatNumber}</strong>
            {' — '}
            {money(seat.price)}

            {seat.ticketCode && (
              <>
                <br />
                <span>
                  Mã vé: {seat.ticketCode}
                </span>
              </>
            )}
          </p>
        ))}

        {/* Hiển thị danh sách đồ ăn & thức uống nếu có */}
        {cartItems.length > 0 && (
          <>
            <h2 style={{ marginTop: '20px' }}>Đồ ăn & Thức uống</h2>
            {cartItems.map((item) => (
              <p key={item.id}>
                <strong>{item.name}</strong> (x{item.quantity}) — {money(item.price * item.quantity)}
              </p>
            ))}
          </>
        )}

        {/* Bảng chi tiết các khoản tiền */}
        <div style={{ marginTop: '15px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
          <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Tiền vé:</span>
            <span>{money(seatTotal)}</span>
          </p>

          {foodTotal > 0 && (
            <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Tiền đồ ăn:</span>
              <span>{money(foodTotal)}</span>
            </p>
          )}

          {appliedCoupon && (
            <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#2ea043' }}>
              <span>Mã giảm giá ({appliedCoupon}):</span>
              <span>-{money(discountAmount)}</span>
            </p>
          )}
        </div>

        <h2 style={{ marginTop: '12px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
          Tổng thanh toán: {money(computedGrandTotal)}
        </h2>

        {verifying && (
          <p className="muted">
            Đang kiểm tra kết quả thanh toán với VNPay...
          </p>
        )}

        {booking.status === 'PENDING' && (
          <>
            <p>
              Còn {Math.floor(seconds / 60)}:
              {String(seconds % 60).padStart(2, '0')}
              {' '}để thanh toán.
            </p>

            <p className="muted">
              Vé chỉ được cấp khi backend xác nhận
              thanh toán thành công và ghế còn hợp lệ.
            </p>

            <button
              className="primary-button"
              disabled={
                busy || verifying || seconds === 0
              }
              onClick={pay}
            >
              {busy
                ? 'Đang xử lý...'
                : 'Thanh toán VNPay sandbox'}
            </button>

            {returnedFromVnpay && (
              <button
                className="text-button"
                disabled={busy || verifying}
                onClick={verifyAgain}
              >
                {verifying
                  ? 'Đang kiểm tra...'
                  : 'Kiểm tra lại thanh toán'}
              </button>
            )}

            <button
              className="text-button"
              disabled={busy || verifying}
              onClick={cancel}
            >
              Hủy đơn và nhả ghế
            </button>

            {seconds === 0 && (
              <p className="form-error">
                Thời gian giữ ghế đã hết.
                Đang cập nhật trạng thái đơn.
              </p>
            )}
          </>
        )}

        {booking.status === 'PAID' && (
          <>
            <p className="form-success">
              Thanh toán đã được xác nhận.
              Vé xem phim của bạn đã sẵn sàng.
            </p>

            <Link
              className="primary-button"
              to={`/tickets/${booking.id}`}
            >
              Xem vé của tôi
            </Link>
          </>
        )}

        {booking.paymentReviewRequired && (
          <p className="form-error">
            Giao dịch cần được đối soát.
            Vé chưa được cấp.
            Vui lòng liên hệ rạp với mã
            {' '}BK-{booking.id}.
          </p>
        )}

        {['CANCELLED', 'EXPIRED'].includes(
          booking.status
        ) && (
          <>
            <p>
              Đơn không còn hiệu lực.
              Hãy quay lại suất chiếu để chọn ghế mới.
            </p>

            {returnedFromVnpay && (
              <button
                className="text-button"
                disabled={verifying}
                onClick={verifyAgain}
              >
                Kiểm tra giao dịch VNPay
              </button>
            )}
          </>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}