import { Link, Outlet } from 'react-router-dom';
import './AdminLayout.css'; // Import CSS riêng ở đây

const AdminLayout = () => {
  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-sidebar-title">ADMIN PANEL</h2>
        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/movies" className="admin-nav-link">Quản lý Phim</Link>
          <Link to="/admin/cinemas" className="admin-nav-link">Quản lý Cụm Rạp</Link>
          <Link to="/admin/showtimes" className="admin-nav-link">Quản lý Suất chiếu</Link>
          <Link to="/admin/users" className="admin-nav-link">Quản lý Người dùng</Link>
          
          <hr className="admin-nav-divider" />
          
          <Link to="/" className="admin-nav-back">Về trang Chủ</Link>
        </nav>
      </aside>

      {/* Admin Content Area */}
      <div className="admin-content-wrapper">
        <header className="admin-header">
          <h3 className="admin-header-title">Hệ thống Quản trị Cinema</h3>
        </header>
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;