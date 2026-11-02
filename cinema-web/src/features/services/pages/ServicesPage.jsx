import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { concessionApi } from '../../concession/api/concessionApi';
import { bookingApi } from '../../booking/api/bookingApi';

const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}đ`;
const errorMessage = (error, fallback) => {
  if (error.response?.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (error.response?.status === 403) return 'Bạn không có quyền cập nhật đơn này.';
  return error.response?.data?.message || fallback;
};

const ServicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const rawId = searchParams.get('bookingId') ?? location.state?.bookingId;
  const bookingId = rawId != null && /^[1-9]\d*$/.test(String(rawId)) ? String(rawId) : null;
  const invalidBookingId = rawId != null && !bookingId;

  const [bookingInfo, setBookingInfo] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(Boolean(bookingId));
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [cart, setCart] = useState({});
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    setBookingInfo(null);
    setCart({});
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setDiscountAmount(0);
    setCheckoutMessage('');
    setCouponError('');
    setBookingLoading(Boolean(bookingId));
    if (!bookingId) return () => { active = false; };

    bookingApi.getById(bookingId).then((data) => {
      if (!active) return;
      setBookingInfo(data);
      setCart(Object.fromEntries((data.concessions || []).map(item => [item.concessionId, item.quantity])));
      setAppliedCoupon(data.couponCode || null);
      setCouponCodeInput(data.couponCode || '');
      setDiscountAmount(Number(data.discountAmount || 0));
    }).catch((error) => {
      if (active) setCheckoutMessage(errorMessage(error, 'Không tải được đơn đặt vé. Hãy tải lại trang.'));
    }).finally(() => {
      if (active) setBookingLoading(false);
    });
    return () => { active = false; };
  }, [bookingId]);

  useEffect(() => {
    let active = true;
    concessionApi.getMenu().then((data) => {
      const rows = Array.isArray(data) ? data : (data?.result || data?.content);
      if (!Array.isArray(rows)) throw new Error('Invalid menu');
      if (active) setMenu(rows.map(item => ({
        id: item.id ?? item.concessionId,
        name: item.name || item.concessionName,
        detail: item.description || 'Món ngon tại rạp CineF',
        price: Number(item.price || 0),
        icon: '🍿',
        tag: '',
      })));
    }).catch(() => {
      if (active) setMenuError('Không tải được thực đơn. Hãy tải lại trang để chọn hoặc sửa món.');
    }).finally(() => {
      if (active) setMenuLoading(false);
    });
    return () => { active = false; };
  }, []);

  const loadedBooking = bookingInfo && String(bookingInfo.id) === bookingId ? bookingInfo : null;
  const remainingSeconds = loadedBooking?.holdExpiresAt
    ? Math.max(0, Math.ceil((Date.parse(loadedBooking.holdExpiresAt) - now) / 1000)) : 0;
  const canEdit = Boolean(loadedBooking?.servicesEditable) && remainingSeconds > 0;
  const inputsDisabled = saving || (Boolean(bookingId) && !canEdit) || invalidBookingId;
  const selectedSeatsList = loadedBooking?.seats || [];
  const totalSeatPrice = Number(loadedBooking?.seatTotal ?? selectedSeatsList.reduce((sum, seat) => sum + Number(seat.price), 0));

  const cartItems = useMemo(() => Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => {
    const live = menu.find(item => String(item.id) === id);
    const saved = bookingInfo?.concessions?.find(item => String(item.concessionId) === id);
    return {
      id: Number(id), quantity, name: live?.name || saved?.name || `Món #${id}`,
      price: Number(live?.price ?? saved?.unitPrice ?? 0), icon: '🍿',
      unavailable: !menuLoading && !menuError && !live,
    };
  }), [cart, menu, menuLoading, menuError, bookingInfo]);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const rawFoodPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = Math.max(0, totalSeatPrice + rawFoodPrice - discountAmount);

  const clearCouponPreview = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError('');
    setCheckoutMessage('');
  };
  const addToCart = (id) => {
    if (inputsDisabled) return;
    clearCouponPreview();
    setCart(current => ({ ...current, [id]: Math.min(99, (current[id] || 0) + 1) }));
  };
  const updateQuantity = (id, change) => {
    if (inputsDisabled) return;
    clearCouponPreview();
    setCart(current => {
      const updated = { ...current };
      const quantity = Math.max(0, Math.min(99, (current[id] || 0) + change));
      if (quantity) updated[id] = quantity;
      else delete updated[id];
      return updated;
    });
  };

  // Only IDs, quantities and the coupon code go to the server.
  // Ticket prices and the final amount are always resolved by the backend.
  const persistServices = async (couponCode) => {
    if (!loadedBooking || !canEdit) throw new Error('Đơn không còn cho phép sửa dịch vụ.');
    if (menuError && cartItems.length) throw new Error('Hãy tải lại thực đơn trước khi lưu món.');
    if (cartItems.some(item => item.unavailable)) throw new Error('Có món đã ngừng bán. Hãy bỏ món đó khỏi giỏ.');
    return bookingApi.updateServices(bookingId, {
      items: cartItems.map(item => ({ concessionId: item.id, quantity: item.quantity })),
      couponCode: couponCode || null,
    });
  };

  const handleApplyCoupon = async () => {
    if (savingRef.current) return;
    if (!canEdit) { setCouponError('Hãy tạo đơn còn hạn trước khi áp dụng mã.'); return; }
    if (!couponCodeInput.trim()) { setCouponError('Vui lòng nhập mã giảm giá.'); return; }
    savingRef.current = true;
    setSaving(true);
    setCouponError('');
    setCheckoutMessage('');
    try {
      const data = await persistServices(couponCodeInput.trim());
      setBookingInfo(data);
      setAppliedCoupon(data.couponCode || null);
      setDiscountAmount(Number(data.discountAmount || 0));
      setMenu(current => current.map(item => {
        const saved = data.concessions?.find(line => line.concessionId === item.id);
        return saved ? { ...item, price: Number(saved.unitPrice) } : item;
      }));
      setCheckoutMessage('Đã lưu món và coupon vào đơn. Coupon được tính trên tổng tiền vé và bắp nước.');
    } catch (error) {
      setCouponError(errorMessage(error, error.message || 'Không áp dụng được mã.'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (inputsDisabled) return;
    clearCouponPreview();
    setCouponCodeInput('');
    setCheckoutMessage('Mã sẽ được gỡ khỏi đơn khi bạn bấm tiếp tục.');
  };

  const handleProceedToCheckout = async () => {
    if (savingRef.current) return;
    if (!loadedBooking) { setCheckoutMessage('Không tải được đơn. Hãy chọn ghế hoặc tải lại trang.'); return; }
    if (!canEdit) { navigate(`/checkout/${bookingId}`); return; }
    if (couponCodeInput.trim() && !appliedCoupon) {
      setCouponError('Bạn đã nhập mã nhưng chưa áp dụng. Hãy bấm Áp dụng hoặc xóa mã để tiếp tục.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setCheckoutMessage('');
    try {
      await persistServices(appliedCoupon);
      navigate(`/checkout/${bookingId}`);
    } catch (error) {
      setCheckoutMessage(errorMessage(error, error.message || 'Không lưu được dịch vụ.'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="page-shell services-page">
      {!bookingId && (
        <div style={{ background: '#21262d', padding: '10px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e3b341', fontSize: '14px' }}>⚠️ Bạn chưa chọn ghế. Bạn đang xem menu ở chế độ tự do.</span>
          <Link to="/" style={{ color: '#58a6ff', fontSize: '14px', textDecoration: 'none' }}>Về trang chủ →</Link>
        </div>
      )}

      {invalidBookingId && <p className="form-error" role="alert">Mã đơn trong đường dẫn không hợp lệ.</p>}
      {bookingLoading && <p role="status">Đang tải đơn đặt vé...</p>}
      {menuLoading && <p role="status">Đang tải thực đơn...</p>}
      {menuError && <p className="form-error" role="alert">{menuError}</p>}
      {!menuLoading && !menuError && !menu.length && <p>Hiện chưa có món đang bán. Bạn vẫn có thể áp mã cho tiền vé và tiếp tục.</p>}
      {loadedBooking && canEdit && <p>Giữ ghế còn {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}. Chọn món không gia hạn giữ ghế.</p>}
      {loadedBooking && !canEdit && <p className="form-error">Đơn đã hết hạn, đã kết thúc hoặc đã bắt đầu thanh toán. Bạn có thể xem lại ở checkout.</p>}
      <section className="services-hero">
        <div className="services-hero-copy">
          <p className="eyebrow">CINEF MOMENTS · MORE THAN A MOVIE</p>
          <h1>Thêm chút vui,<br /><span>trọn buổi xem.</span></h1>
          <p>Bắp rang vừa nổ, thức uống mát lạnh và những trải nghiệm được chuẩn bị cho buổi hẹn điện ảnh đáng nhớ.</p>
          <a href="#snack-menu" className="services-hero-button">Khám phá bắp & nước <span>↓</span></a>
        </div>
      </section>

      <section className="snack-menu-section" id="snack-menu">
        <div className="services-section-heading">
          <div><p className="eyebrow">QUẦY BẮP NƯỚC</p><h2>Chọn món yêu thích</h2></div>
          <span>Thêm món vào giỏ để xem tóm tắt</span>
        </div>
        <div className="services-order-layout">
          <div className="snack-grid">
            {menu.map((item) => (
              <article className="snack-card" key={item.id}>
                <div className={`snack-illustration snack-${item.id}`}><span>{item.icon}</span>{item.tag && <small>{item.tag}</small>}</div>
                <div className="snack-card-content">
                  <h3>{item.name}</h3>
                  <p>{item.detail}</p>
                  <div className="snack-card-bottom">
                    <strong>{formatPrice(item.price)}</strong>
                    <button type="button" disabled={inputsDisabled || menuLoading} onClick={() => addToCart(item.id)}>＋ Thêm</button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="snack-cart">
            <div className="snack-cart-heading">
              <div><p className="eyebrow">GIỎ MÓN</p><h3>Cho buổi xem này</h3></div>
              <span>{totalItems}</span>
            </div>

            {/* Hiển thị thông tin ghế đã chọn ở trang dịch vụ */}
            <div style={{ background: '#161b22', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #30363d' }}>
              <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '4px' }}>🎟️ Ghế đã chọn ({selectedSeatsList.length}):</div>
              <div style={{ fontSize: '14px', color: '#c9d1d9', fontWeight: 'bold' }}>
                {selectedSeatsList.length > 0 
                  ? selectedSeatsList.map(s => s.seatNumber || s.seatName || s.seatId).join(', ') 
                  : 'Chưa có ghế nào'}
              </div>
            </div>

            {cartItems.length ? (
              <div className="snack-cart-items">
                {cartItems.map((item) => (
                  <div className="snack-cart-item" key={item.id}>
                    <span className="cart-item-icon">{item.icon}</span>
                    <span className="cart-item-name"><strong>{item.name}{item.unavailable ? " (đã ngừng bán)" : ""}</strong><small>{formatPrice(item.price)}</small></span>
                    <div className="quantity-control">
                      <button type="button" aria-label={`Bớt ${item.name}`} disabled={inputsDisabled} onClick={() => updateQuantity(item.id, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" aria-label={`Thêm ${item.name}`} disabled={inputsDisabled || item.unavailable} onClick={() => updateQuantity(item.id, 1)}>＋</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-cart"><span>🧺</span><p>Giỏ đồ ăn đang trống.</p><small>Có thể bỏ qua nếu không mua thêm!</small></div>
            )}

            <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
              <label style={{ fontSize: '13px', color: '#aaa', display: 'block', marginBottom: '6px' }}>Mã giảm giá</label>
              {!appliedCoupon ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Nhập mã (VD: SPRING)" 
                    maxLength={50}
                    disabled={inputsDisabled}
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', fontSize: '14px' }}
                  />
                  <button type="button" disabled={inputsDisabled || !canEdit || menuLoading} onClick={handleApplyCoupon} style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Áp dụng</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', padding: '8px 12px', borderRadius: '6px', border: '1px solid #2ea043' }}>
                  <span style={{ color: '#2ea043', fontWeight: 'bold', fontSize: '13px' }}>Đang áp dụng: {appliedCoupon}</span>
                  <button type="button" disabled={inputsDisabled} onClick={handleRemoveCoupon} style={{ background: 'transparent', color: '#f85149', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Gỡ bỏ</button>
                </div>
              )}
              {couponError && <p style={{ fontSize: '12px', marginTop: '6px', color: '#f85149' }}>{couponError}</p>}
            </div>

            <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="cart-total" style={{ border: 'none', padding: 0, margin: 0 }}>
                <span>Tiền vé ({selectedSeatsList.length} ghế)</span>
                <span>{formatPrice(totalSeatPrice)}</span>
              </div>

              <div className="cart-total" style={{ border: 'none', padding: 0, margin: 0 }}>
                <span>Tiền đồ ăn</span>
                <span>{formatPrice(rawFoodPrice)}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#2ea043' }}>
                  <span>Giảm giá toàn đơn</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="cart-total" style={{ border: 'none', padding: '4px 0 0 0', margin: 0, fontSize: '18px' }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Tạm tính</span>
                <strong style={{ color: '#ff4d4f' }}>{formatPrice(grandTotal)}</strong>
              </div>
            </div>

            <button 
              type="button" 
              className="checkout-button" 
              disabled={saving || bookingLoading || menuLoading || !loadedBooking}
              onClick={handleProceedToCheckout}
            >
              {saving ? 'Đang lưu...' : 'Tiếp tục đến thanh toán'} <span>→</span>
            </button>
            
            
            {checkoutMessage && <p className="checkout-demo-message" role="status">{checkoutMessage}</p>}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;