import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { couponApi } from "../../concession/api/couponApi";
import { concessionApi } from "../../concession/api/concessionApi";

// Danh sách dự phòng để giao diện không bị trống nếu API chưa phản hồi
const defaultMenu = [
  { id: 'classic', name: 'Bắp rang bơ cổ điển', detail: 'Bắp rang thơm nóng · size vừa', price: 59000, icon: '🍿', tag: 'BESTSELLER' },
  { id: 'caramel', name: 'Bắp caramel', detail: 'Caramel giòn ngọt · size lớn', price: 79000, icon: '🍿', tag: 'VỊ MỚI' },
  { id: 'soda', name: 'Soda trái cây', detail: 'Chanh dây / dâu · 700 ml', price: 45000, icon: '🥤', tag: '' },
  { id: 'duo', name: 'Combo xem phim đôi', detail: '2 bắp vừa + 2 nước ngọt', price: 149000, icon: '🎟️', tag: 'TIẾT KIỆM' },
];

const services = [
  { icon: '🎂', title: 'Tiệc phim riêng tư', detail: 'Tổ chức sinh nhật, buổi hẹn nhóm hoặc sự kiện nhỏ trong không gian phòng chiếu.' },
  { icon: '🎁', title: 'Thẻ quà tặng CineF', detail: 'Gửi tặng một buổi xem phim và món bắp nước yêu thích cho người đặc biệt.' },
  { icon: '✨', title: 'Hội viên CineF', detail: 'Theo dõi ưu đãi, nhận tin phim mới và tích lũy quyền lợi thành viên.' },
];

const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}đ`;

const ServicesPage = () => {
  const [menu, setMenu] = useState(defaultMenu);
  const [cart, setCart] = useState({});
  const [checkoutMessage, setCheckoutMessage] = useState('');

  // States quản lý mã giảm giá
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');

  // Gọi API lấy dữ liệu món ăn từ Backend (concessionApi)
  useEffect(() => {
    const fetchConcessionsFromBackend = async () => {
      try {
        console.log("Đang gọi API lấy menu F&B...");
        const data = await concessionApi.getMenu();
        console.log("Dữ liệu menu nhận từ API:", data);

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
        } else {
          console.warn("API trả về danh sách trống, giữ nguyên menu mặc định.");
        }
      } catch (error) {
        console.error("Lỗi chi tiết khi gọi API concession:", error);
      }
    };

    fetchConcessionsFromBackend();
  }, []);

  const cartItems = useMemo(
    () => menu.filter((item) => cart[item.id]).map((item) => ({ ...item, quantity: cart[item.id] })),
    [cart, menu],
  );
  
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const finalPrice = Math.max(0, totalPrice - discountAmount);

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

    if (totalPrice <= 0) {
      setCouponError('Giỏ hàng đang trống!');
      return;
    }

    try {
      setCouponError('');
      const discount = await couponApi.validateCoupon(couponCodeInput.trim().toUpperCase(), totalPrice);
      const numericDiscount = Number(discount);

      if (numericDiscount > 0) {
        setDiscountAmount(numericDiscount);
        setAppliedCoupon(couponCodeInput.trim().toUpperCase());
        setCouponError('');
      } else {
        setDiscountAmount(0);
        setAppliedCoupon(null);
        setCouponError('Mã không hợp lệ, chưa đến hạn hoặc chưa đạt giá trị đơn hàng tối thiểu!');
      }
    } catch (error) {
      console.error("Lỗi áp dụng mã giảm giá:", error);
      setDiscountAmount(0);
      setAppliedCoupon(null);
      const serverMsg = error.response?.data;
      setCouponError(typeof serverMsg === 'string' ? serverMsg : 'Mã giảm giá không hợp lệ hoặc không tồn tại.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCodeInput('');
    setCouponError('');
  };

  return (
    <div className="page-shell services-page">
      <section className="services-hero">
        <div className="services-hero-copy">
          <p className="eyebrow">CINEF MOMENTS · MORE THAN A MOVIE</p>
          <h1>Thêm chút vui,<br /><span>trọn buổi xem.</span></h1>
          <p>Bắp rang vừa nổ, thức uống mát lạnh và những trải nghiệm được chuẩn bị cho buổi hẹn điện ảnh đáng nhớ.</p>
          <a href="#snack-menu" className="services-hero-button">Khám phá bắp & nước <span>↓</span></a>
        </div>
        <div className="services-hero-visual" aria-hidden="true">
          <div className="snack-sparkle sparkle-one">✦</div><div className="snack-sparkle sparkle-two">✧</div>
          <div className="hero-popcorn">🍿</div><div className="hero-drink">🥤</div>
          <span className="hero-stamp">MOVIE<br />NIGHT</span>
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
              <div className="empty-cart"><span>🧺</span><p>Giỏ của bạn đang trống.</p><small>Chọn một món thật ngon nhé!</small></div>
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
                    style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #30363d', background: '#0d1117', color: '#fff', outline: 'none', fontSize: '14px' }}
                  />
                  <button 
                    type="button"
                    onClick={handleApplyCoupon}
                    style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                  >
                    Áp dụng
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', padding: '8px 12px', borderRadius: '6px', border: '1px solid #2ea043' }}>
                  <span style={{ color: '#2ea043', fontWeight: 'bold', fontSize: '13px' }}>Đang áp dụng: {appliedCoupon}</span>
                  <button 
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{ background: 'transparent', color: '#f85149', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    Gỡ bỏ
                  </button>
                </div>
              )}
              {couponError && <p style={{ fontSize: '12px', marginTop: '6px', color: '#f85149' }}>{couponError}</p>}
            </div>

            <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="cart-total" style={{ border: 'none', padding: 0, margin: 0 }}>
                <span>Tạm tính</span>
                <span style={{ color: discountAmount > 0 ? '#888' : '#fff', textDecoration: discountAmount > 0 ? 'line-through' : 'none' }}>
                  {formatPrice(totalPrice)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#2ea043' }}>
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="cart-total" style={{ border: 'none', padding: 0, margin: '4px 0 0 0', fontSize: '18px' }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>Tổng thanh toán</span>
                <strong style={{ color: '#ff4d4f' }}>{formatPrice(finalPrice)}</strong>
              </div>
            </div>

            <button 
              type="button" 
              className="checkout-button" 
              disabled={!totalItems} 
              onClick={() => setCheckoutMessage('Đây là bản mô phỏng giao diện. Đơn hàng chưa được gửi đến rạp.')}
            >
              Xem trước đơn hàng <span>→</span>
            </button>
            
            {checkoutMessage && <p className="checkout-demo-message" role="status">{checkoutMessage}</p>}
            <p className="cart-demo-note">Bản demo giao diện · Chưa kết nối đặt món hoặc thanh toán.</p>
          </aside>
        </div>
      </section>

      <section className="extra-services-section">
        <div className="services-section-heading"><div><p className="eyebrow">CINEF, THE WAY YOU LIKE</p><h2>Thêm trải nghiệm, thêm kỷ niệm</h2></div></div>
        <div className="extra-services-grid">
          {services.map((service) => <article className="extra-service-card" key={service.title}><span>{service.icon}</span><h3>{service.title}</h3><p>{service.detail}</p><Link to="/login">Tìm hiểu thêm <span aria-hidden="true">↗</span></Link></article>)}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;