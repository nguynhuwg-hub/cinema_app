import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { couponApi } from "../../concession/api/couponApi";
import { concessionApi } from "../../concession/api/concessionApi";
import { bookingApi } from "../../booking/api/bookingApi";

const defaultMenu = [
  { id: 'classic', name: 'Bắp rang bơ cổ điển', detail: 'Bắp rang thơm nóng · size vừa', price: 59000, icon: '🍿', tag: 'BESTSELLER' },
  { id: 'caramel', name: 'Bắp caramel', detail: 'Caramel giòn ngọt · size lớn', price: 79000, icon: '🍿', tag: 'VỊ MỚI' },
  { id: 'soda', name: 'Soda trái cây', detail: 'Chanh dây / dâu · 700 ml', price: 45000, icon: '🥤', tag: '' },
  { id: 'duo', name: 'Combo xem phim đôi', detail: '2 bắp vừa + 2 nước ngọt', price: 149000, icon: '🎟️', tag: 'TIẾT KIỆM' },
];

const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}đ`;

const ServicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận dữ liệu truyền từ trang chọn ghế sang qua state
  const bookingData = location.state || {};
  const { bookingId, showtime: passedShowtime } = bookingData;

  const [bookingInfo, setBookingInfo] = useState(null);
  const [menu, setMenu] = useState(defaultMenu);
  const [cart, setCart] = useState({});
  const [checkoutMessage, setCheckoutMessage] = useState('');

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Tải thông tin chi tiết đơn hàng (bao gồm danh sách ghế và tiền vé) từ backend dựa vào bookingId
  useEffect(() => {
    let active = true;

    const fetchBookingDetails = async () => {
      if (!bookingId) return;
      try {
        const data = await bookingApi.getById(bookingId);
        if (active && data) {
          const resolvedBooking = data.result || data.data || data;
          setBookingInfo(resolvedBooking);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin đơn hàng:", error);
      }
    };

    fetchBookingDetails();

    return () => {
      active = false;
    };
  }, [bookingId]);

  // Tải menu bắp nước từ backend
  useEffect(() => {
    const fetchConcessionsFromBackend = async () => {
      try {
        const data = await concessionApi.getMenu();
        const concessionList = Array.isArray(data) ? data : (data?.result || data?.content || []);

        if (concessionList.length > 0) {
          const formattedMenu = concessionList.map((item) => ({
            id: item.id || item.concessionId,
            name: item.name || item.concessionName,
            detail: item.description || 'Món ngon tại rạp CineF',
            price: item.price || 0,
            icon: '🍿',
            tag: item.status === 'ACTIVE' || item.isActive ? '' : 'ĐANG BÁN'
          }));
          setMenu(formattedMenu);
        }
      } catch (error) {
        console.error("Lỗi khi gọi API concession:", error);
      }
    };

    fetchConcessionsFromBackend();
  }, []);

  // Lấy danh sách ghế và tổng tiền vé từ dữ liệu API đơn hàng (hoặc fallback về state truyền sang nếu có)
  const selectedSeatsList = bookingInfo?.seats || bookingData.selectedDetails || [];
  const totalSeatPrice = bookingInfo?.totalAmount || bookingData.totalSeatPrice || 0;

  const cartItems = useMemo(
    () => menu.filter((item) => cart[item.id]).map((item) => ({ ...item, quantity: cart[item.id] })),
    [cart, menu],
  );
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const rawFoodPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const finalFoodPrice = Math.max(0, rawFoodPrice - discountAmount);
  const grandTotal = totalSeatPrice + finalFoodPrice;

  const addToCart = (id) => {
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
    setCheckoutMessage('');
  };

  const updateQuantity = (id, change) => {
    setCart((current) => {
      const quantity = Math.max(0, (current[id] || 0) + change);
      const updated = { ...current };
      if (quantity) updated[id] = quantity;
      else delete updated[id];
      return updated;
    });
    setCheckoutMessage('');
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá!');
      return;
    }

    if (rawFoodPrice <= 0) {
      setCouponError('Giỏ hàng đang trống!');
      return;
    }

    try {
      setCouponError('');
      const discount = await couponApi.validateCoupon(couponCodeInput.trim().toUpperCase(), rawFoodPrice);
      const numericDiscount = Number(discount);

      if (numericDiscount > 0) {
        setDiscountAmount(numericDiscount);
        setAppliedCoupon(couponCodeInput.trim().toUpperCase());
        setCouponError('');
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        setCouponError('Mã không hợp lệ hoặc chưa đạt giá trị đơn hàng tối thiểu!');
      }
    } catch (error) {
      setDiscountAmount(0);
      setAppliedCoupon(null);
      const serverMsg = error.response?.data;
      setCouponError(typeof serverMsg === 'string' ? serverMsg : 'Mã giảm giá không hợp lệ.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCodeInput('');
    setCouponError('');
  };

  const handleProceedToCheckout = () => {
    if (!bookingId) {
      setCheckoutMessage('Không tìm thấy thông tin đặt vé. Vui lòng chọn lại ghế từ đầu.');
      return;
    }

    navigate(`/checkout/${bookingId}`, {
      state: {
        bookingId,
        showtime: passedShowtime,
        selectedDetails: selectedSeatsList,
        totalSeatPrice,
        cartItems,
        foodTotal: finalFoodPrice,
        grandTotal,
        appliedCoupon,
        discountAmount,
      },
    });
  };

  return (
    <div className="page-shell services-page">
      {!bookingId && (
        <div style={{ background: '#21262d', padding: '10px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e3b341', fontSize: '14px' }}>⚠️ Bạn chưa chọn ghế. Bạn đang xem menu ở chế độ tự do.</span>
          <Link to="/" style={{ color: '#58a6ff', fontSize: '14px', textDecoration: 'none' }}>Về trang chủ →</Link>
        </div>
      )}

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
                    <button type="button" onClick={() => addToCart(item.id)}>＋ Thêm</button>
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
                    <span className="cart-item-name"><strong>{item.name}</strong><small>{formatPrice(item.price)}</small></span>
                    <div className="quantity-control">
                      <button type="button" aria-label={`Bớt ${item.name}`} onClick={() => updateQuantity(item.id, -1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" aria-label={`Thêm ${item.name}`} onClick={() => updateQuantity(item.id, 1)}>＋</button>
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
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', fontSize: '14px' }}
                  />
                  <button type="button" onClick={handleApplyCoupon} style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Áp dụng</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', padding: '8px 12px', borderRadius: '6px', border: '1px solid #2ea043' }}>
                  <span style={{ color: '#2ea043', fontWeight: 'bold', fontSize: '13px' }}>Đang áp dụng: {appliedCoupon}</span>
                  <button type="button" onClick={handleRemoveCoupon} style={{ background: 'transparent', color: '#f85149', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Gỡ bỏ</button>
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
                  <span>Giảm giá F&B</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="cart-total" style={{ border: 'none', padding: '4px 0 0 0', margin: 0, fontSize: '18px' }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Tổng thanh toán</span>
                <strong style={{ color: '#ff4d4f' }}>{formatPrice(grandTotal)}</strong>
              </div>
            </div>

            <button 
              type="button" 
              className="checkout-button" 
              onClick={handleProceedToCheckout}
            >
              Tiếp tục đến thanh toán <span>→</span>
            </button>
            
            {checkoutMessage && <p className="checkout-demo-message" role="status">{checkoutMessage}</p>}
          </aside>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;