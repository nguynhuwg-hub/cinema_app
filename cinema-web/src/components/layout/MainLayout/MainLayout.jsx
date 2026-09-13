import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { userApi } from '../../../features/user/api/userApi';
import './MainLayout.css';

const MainLayout = () => {
  const location = useLocation();
  const { login, logout, isAuthenticated, isAdmin, user } = useAuth();
  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenMessage, setTokenMessage] = useState('');

  const saveTestToken = async (event) => {
    event.preventDefault();
    const token = tokenInput.trim().replace(/^Bearer\s+/i, '');
    if (!token) {
      setTokenMessage('Hãy dán access token trước.');
      return;
    }

    localStorage.setItem('access_token', token);
    try {
      const profile = await userApi.getProfile();
      login(profile, token);
      setTokenInput('');
      setTokenMessage(`Đã kết nối: ${profile.fullName || profile.email}`);
    } catch (error) {
      localStorage.removeItem('access_token');
      setTokenMessage(error.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
    }
  };

  return (
    <div className="main-layout-container">
      {/* Header */}
      <header className="main-header netflix-header">
        <div className="main-header-content">
          <Link to="/" className="main-logo netflix-logo">
            CINE<span>F</span>
          </Link>

          <nav className="main-nav">
            <Link to="/" className={`main-nav-link ${location.pathname === '/' ? 'active' : ''}`}>Phim</Link>
            <Link to="/cinemas" className={`main-nav-link ${location.pathname.startsWith('/cinemas') ? 'active' : ''}`}>Cụm Rạp</Link>

            {isAuthenticated ? (
              <>
                <Link to="/profile" className={`main-nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>Hồ sơ</Link>
                <Link to="/notifications" className={`main-nav-link ${location.pathname === '/notifications' ? 'active' : ''}`}>Thông báo</Link>
              {isAdmin && <Link to="/admin/dashboard" className="admin-link">Quản trị</Link>}
                <button onClick={logout} className="logout-button">Đăng xuất</button>
              </>
          ) : (
            <div className="auth-buttons">
                <Link to="/login" className="login-button">Đăng nhập</Link>
                <Link to="/register" className="register-button">Đăng ký</Link>
            </div>
         )}
        </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <p>© 2026 Cinema Web Project. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;