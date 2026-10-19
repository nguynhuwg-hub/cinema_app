import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { concessionApi } from '../../concession/api/concessionApi'; // Đã sửa đúng đường dẫn tương đối

const services = [
  { icon: '🎂', title: 'Tiệc phim riêng tư', detail: 'Tổ chức sinh nhật, buổi hẹn nhóm hoặc sự kiện nhỏ trong không gian phòng chiếu.' },
  { icon: '🎁', title: 'Thẻ quà tặng CineF', detail: 'Gửi tặng một buổi xem phim và món bắp nước yêu thích cho người đặc biệt.' },
  { icon: '✨', title: 'Hội viên CineF', detail: 'Theo dõi ưu đãi, nhận tin phim mới và tích lũy quyền lợi thành viên.' },
];

const formatPrice = (price) => `${Number(price || 0).toLocaleString('vi-VN')}đ`;

const ServicesPage = () => {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [checkoutMessage, setCheckoutMessage] = useState('');

  // Lấy danh sách món ăn/đồ uống từ API Backend (do Admin thêm và bật Đang bán)
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await concessionApi.getMenu();
        const formattedMenu = data.map(item => ({
          id: item.id,
          name: item.name,
          detail: item.description || 'Bắp rang thơm nóng · size vừa',
          price: item.price,
          icon: item.imageUrl ? item.imageUrl : '🍿', 
          isImage: !!item.imageUrl,
          tag: item.tag || ''
        }));
        setMenu(formattedMenu);
      } catch (error) {
        console.error("Lỗi khi tải menu quầy bắp nước:", error);
      }
    };
    fetchMenu();
  }, []);

  const cartItems = useMemo(
    () => menu.filter((item) => cart[item.id]).map((item) => ({ ...item, quantity: cart[item.id] })),
    [menu, cart],
  );
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

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
        <div className="services-section-heading"><div><p className="eyebrow">QUẦY BẮP NƯỚC</p><h2>Chọn món yêu thích</h2></div><span>Thêm món vào giỏ để xem tóm tắt</span></div>
        <div className="services-order-layout">
          <div className="snack-grid">
            {menu.map((item) => (
              <article className="snack-card" key={item.id}>
                <div className={`snack-illustration snack-${item.id}`}>
                  {item.isImage ? (
                    <img src={item.icon} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <span>{item.icon}</span>
                  )}
                  {item.tag && <small>{item.tag}</small>}
                </div>
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
            {menu.length === 0 && (
              <p style={{ color: '#8b949e', gridColumn: 'span 2', padding: '20px' }}>Đang tải danh sách món ăn từ hệ thống...</p>
            )}
          </div>
          <aside className="snack-cart">
            <div className="snack-cart-heading"><div><p className="eyebrow">GIỎ MÓN</p><h3>Cho buổi xem này</h3></div><span>{totalItems}</span></div>
            {cartItems.length ? (
              <div className="snack-cart-items">
                {cartItems.map((item) => (
                  <div className="snack-cart-item" key={item.id}>
                    <span className="cart-item-icon">{item.isImage ? '🍿' : item.icon}</span>
                    <span className="cart-item-name"><strong>{item.name}</strong><small>{formatPrice(item.price)}</small></span>
                    <div className="quantity-control"><button type="button" aria-label={`Bớt ${item.name}`} onClick={() => updateQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button type="button" aria-label={`Thêm ${item.name}`} onClick={() => updateQuantity(item.id, 1)}>＋</button></div>
                  </div>
                ))}
              </div>
            ) : <div className="empty-cart"><span>🧺</span><p>Giỏ của bạn đang trống.</p><small>Chọn một món thật ngon nhé!</small></div>}
            <div className="cart-total"><span>Tạm tính</span><strong>{formatPrice(totalPrice)}</strong></div>
            <button type="button" className="checkout-button" disabled={!totalItems} onClick={() => setCheckoutMessage('Đây là bản mô phỏng giao diện. Đơn hàng chưa được gửi đến rạp.')}>Xem trước đơn hàng <span>→</span></button>
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