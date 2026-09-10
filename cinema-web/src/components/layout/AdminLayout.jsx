import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '240px', background: '#2c3e50', color: '#ecf0f1', padding: '1.5rem 1rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#3498db' }}>ADMIN PANEL</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/admin/dashboard" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/admin/movies" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Quản lý Phim</Link>
          <Link to="/admin/cinemas" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Quản lý Cụm Rạp</Link>
          <Link to="/admin/users" style={{ color: '#ecf0f1', textDecoration: 'none' }}>Quản lý Người dùng</Link>
          <hr style={{ borderColor: '#34495e', width: '100%', margin: '1rem 0' }} />
          <Link to="/" style={{ color: '#bdc3c7', textDecoration: 'none' }}>← Về trang Khách</Link>
          <button onClick={handleLogout} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '0.5rem', cursor: 'pointer', borderRadius: '4px', marginTop: '1rem' }}>
            Đăng xuất
          </button>
        </nav>
      </aside>

      {/* Admin Content Area */}
      <div style={{ flex: 1, background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
        <header style={{ background: '#fff', padding: '1rem 2rem', borderBottom: '1px solid #dee2e6' }}>
          <h3 style={{ margin: 0 }}>Hệ thống Quản trị Cinema</h3>
        </header>
        <main style={{ padding: '2rem', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;