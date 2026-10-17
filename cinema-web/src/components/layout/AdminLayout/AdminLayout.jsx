import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const links = [
    { to: '/admin/dashboard', label: 'Tổng quan', icon: '◫' },
    { to: '/admin/movies', label: 'Phim & thể loại', icon: '▣' },
    { to: '/admin/reviews', label: 'Quản lý bài đánh giá', icon: '✎' },
    { to: '/admin/cinemas', label: 'Rạp & phòng chiếu', icon: '⌂' },
    { to: '/admin/showtimes', label: 'Suất chiếu', icon: '◷' },
    { to: '/admin/users', label: 'Tài khoản', icon: '♙' },
    // --- Thêm hai mục quản lý mới vào đây ---
    { to: '/admin/concessions', label: 'Đồ ăn & Thức uống (F&B)', icon: '🍿' },
    { to: '/admin/coupons', label: 'Mã giảm giá (Coupon)', icon: '🎟️' },
  ];

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <Link to="/admin/dashboard" className="admin-brand"><span className="admin-brand-mark">C</span><span>CINEF<small>CONTROL ROOM</small></span></Link>
        <p className="admin-nav-caption">KHÔNG GIAN QUẢN TRỊ</p>
        <nav className="admin-nav" aria-label="Điều hướng quản trị">
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-link ${location.pathname === item.to ? 'active' : ''}`}
              aria-current={location.pathname === item.to ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <div className="admin-user-card"><span className="admin-avatar">{(user?.fullName || 'A').slice(0, 1).toUpperCase()}</span><span><strong>{user?.fullName || 'Quản trị viên'}</strong><small>ADMINISTRATOR</small></span></div>
          <button type="button" className="admin-signout" onClick={signOut}>↪ <span>Đăng xuất</span></button>
        </div>
      </aside>
      <div className="admin-content-wrapper">
        <header className="admin-header">
          <div><span className="admin-status-dot" /> KHU VỰC QUẢN TRỊ <span className="admin-header-divider">/</span> CINEF</div>
          <span className="admin-header-date">{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date())}</span>
        </header>
        <main className="admin-main-content"><Outlet /></main>
      </div>
    </div>
  );
};

export default AdminLayout;