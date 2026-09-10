import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: '#1a1a1a', color: '#fff', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <Link to="/" style={{ color: '#e50914', fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none' }}>
            CINEMA WEB
          </Link>

          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Phim</Link>
            <Link to="/cinemas" style={{ color: '#fff', textDecoration: 'none' }}>Cụm Rạp</Link>

            {isAuthenticated ? (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link to="/profile" style={{ color: '#fff', textDecoration: 'none' }}>
                  Xin chào, {user?.name || user?.email}
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin/dashboard" style={{ color: '#ffc107', textDecoration: 'none' }}>
                    [Trang Admin]
                  </Link>
                )}
                <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}>
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Đăng nhập</Link>
                <Link to="/register" style={{ color: '#e50914', textDecoration: 'none' }}>Đăng ký</Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '2rem auto', padding: '0 1rem' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ background: '#111', color: '#888', textAlign: 'center', padding: '1.5rem', marginTop: 'auto' }}>
        <p>© 2026 Cinema Web Project. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;