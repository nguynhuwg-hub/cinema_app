
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../../context/AuthContext';
import './MainLayout.css';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    logout,
    isAuthenticated,
    hasRole,
    user,
  } = useAuth();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="main-layout-container">
      {/* HEADER */}
      <header className="main-header netflix-header">
        <div className="main-header-content">
          {/* LOGO */}
          <Link
            to="/"
            className="main-logo netflix-logo"
            aria-label="CineF - Trang chủ"
          >
            CINE<span>F</span>
          </Link>

          {/* NAVIGATION */}
          <nav className="main-nav">
            <Link
              to="/"
              className={`main-nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Trang chủ
            </Link>

            <Link
              to="/cinemas"
              className={`main-nav-link ${isActive('/cinemas') ? 'active' : ''}`}
            >
              Rạp chiếu
            </Link>

            <Link
              to="/reviews"
              className={`main-nav-link ${isActive('/reviews') ? 'active' : ''}`}
            >
              Góc phê bình
            </Link>

            <Link
              to="/services"
              className={`main-nav-link ${isActive('/services') ? 'active' : ''}`}
            >
              Dịch vụ
            </Link>

            {isAuthenticated ? (
              <>
                {/* ADMIN SYSTEM */}
                {hasRole('ADMIN') && (
                  <Link
                    to="/admin/role-permissions"
                    className={`main-nav-link ${
                      isActive('/admin') ? 'active' : ''
                    }`}
                  >
                    Quản trị hệ thống
                  </Link>
                )}

                {/* MANAGER */}
                {hasRole('MANAGER') && (
                  <Link
                    to="/manager/dashboard"
                    className={`main-nav-link ${
                      isActive('/manager') ? 'active' : ''
                    }`}
                  >
                    Quản lý vận hành
                  </Link>
                )}

                {/* MY BOOKINGS */}
                <Link
                  to="/bookings"
                  className={`main-nav-link ${
                    isActive('/bookings') ? 'active' : ''
                  }`}
                >
                  Vé của tôi
                </Link>

                {/* PROFILE */}
                <Link
                  to="/profile"
                  className={`header-profile-link ${
                    isActive('/profile') ? 'active' : ''
                  }`}
                  aria-label="Mở hồ sơ cá nhân"
                >
                  <span className="header-profile-avatar">
                    {(
                      user?.fullName ||
                      user?.email ||
                      'U'
                    ).slice(0, 1).toUpperCase()}
                  </span>

                  <span>
                    {user?.fullName ||
                      user?.email ||
                      'Tài khoản'}
                  </span>

                  <span
                    className="header-profile-arrow"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                </Link>

                {/* NOTIFICATIONS */}
                <Link
                  to="/notifications"
                  className={`main-nav-link ${
                    isActive('/notifications') ? 'active' : ''
                  }`}
                >
                  Thông báo
                </Link>

                {/* LOGOUT */}
                <button
                  type="button"
                  onClick={signOut}
                  className="logout-button"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="auth-buttons">
                <Link
                  to="/login"
                  className="login-button"
                >
                  Đăng nhập
                </Link>

                <Link
                  to="/register"
                  className="register-button"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="main-footer">
        <div className="footer-content">
          <Link to="/" className="footer-logo">
            CINEF
          </Link>

          <p>Điện ảnh hay hơn khi được sẻ chia.</p>

          <span>
            © 2026 CineF. Trải nghiệm điện ảnh của bạn.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
