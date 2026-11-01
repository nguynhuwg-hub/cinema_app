import {
  NavLink,
  Outlet,
  useNavigate
} from 'react-router-dom';

import { useAuth } from '../../../context/AuthContext';
import './AdminSystemLayout.css';

const AdminSystemLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.fullName || user?.email || 'Administrator';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navigation = [
    {
      to: '/admin/role-permissions',
      icon: '▣',
      label: 'Vai trò & phân quyền'
    },
    {
      to: '/admin/users',
      icon: '♙',
      label: 'Quản lý tài khoản'
    },
    // --- ĐÃ THÊM 2 MỤC NÀY VÀO ---
    {
      to: '/admin/concessions',
      icon: '🍿',
      label: 'Quản lý F&B'
    },
    {
      to: '/admin/coupons',
      icon: '🎟️',
      label: 'Quản lý Mã giảm giá'
    },
    // ----------------------------
    {
      to: '/profile',
      icon: '◉',
      label: 'Hồ sơ cá nhân'
    },
    {
      to: '/',
      icon: '↗',
      label: 'Trải nghiệm khách hàng'
    }
  ];

  return (
    <div className="system-layout">
      {/* SIDEBAR */}
      <aside className="system-sidebar">

        <NavLink
          to="/admin/role-permissions"
          className="system-brand"
        >
          <span className="system-brand-icon">C</span>

          <span className="system-brand-text">
            <strong>CINEF</strong>
            <small>SYSTEM CONTROL</small>
          </span>
        </NavLink>

        <div className="system-navigation">
          <p className="system-menu-caption">
            QUẢN TRỊ HỆ THỐNG
          </p>

          {navigation.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `system-nav-item ${
                  isActive ? 'active' : ''
                }`
              }
            >
              <span className="system-nav-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}

          {hasRole('MANAGER') && (
            <>
              <p className="system-menu-caption">
                KHÔNG GIAN KHÁC
              </p>

              <NavLink
                to="/manager/dashboard"
                className="system-nav-item"
              >
                <span className="system-nav-icon">↗</span>
                <span>Quản lý vận hành</span>
              </NavLink>
            </>
          )}
        </div>

        {/* USER INFO */}
        <div className="system-sidebar-bottom">
          <div className="system-account">
            <span className="system-avatar">
              {displayName.charAt(0).toUpperCase()}
            </span>

            <div className="system-account-info">
              <strong>{displayName}</strong>
              <small>ADMINISTRATOR</small>
            </div>
          </div>

          <NavLink
            to="/profile"
            className="system-bottom-link"
          >
            ◉ &nbsp; Hồ sơ cá nhân
          </NavLink>

          <button
            type="button"
            className="system-logout"
            onClick={handleLogout}
          >
            ↪ &nbsp; Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="system-content">
        <header className="system-header">
          <div className="system-header-location">
            <span className="system-status-dot" />
            KHU VỰC QUẢN TRỊ
            <span className="system-header-divider">/</span>
            CINEF
          </div>

          <div className="system-header-right">
            <span className="system-header-date">
              {new Intl.DateTimeFormat('vi-VN', {
                dateStyle: 'full'
              }).format(new Date())}
            </span>

            <button
              className="system-header-logout"
              onClick={handleLogout}
              type="button"
            >
              ↪ Đăng xuất
            </button>
          </div>
        </header>

        <main className="system-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminSystemLayout;