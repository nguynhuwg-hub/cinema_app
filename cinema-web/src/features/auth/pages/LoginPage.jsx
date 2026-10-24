import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi, getApiErrorMessage } from '../api/authApi';
import { useAuth } from '../../../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Backend trả về JwtAuthResponse bọc trong ApiResponse.data
      const result = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });

      if (!result?.accessToken) {
        throw new Error('Hệ thống không nhận được Access Token hợp lệ.');
      }

      // Lưu trữ Refresh Token vào localStorage để phục vụ cho cơ chế Refresh Token Rotation
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }

      // Lưu thông tin đăng nhập vào AuthContext
      login(result, result.accessToken);

      // Chuyển hướng về trang trước đó hoặc trang chủ
      const roles = result.roles ?? result.role ?? [];

const normalizedRoles = (Array.isArray(roles) ? roles : [roles])
  .map((role) => typeof role === 'string' ? role : role?.name);

const isAdmin = normalizedRoles.some(
  (role) => role === 'ADMIN' || role === 'ROLE_ADMIN'
);

const isManager = normalizedRoles.some(
  (role) => role === 'MANAGER' || role === 'ROLE_MANAGER'
);

const requestedPath = location.state?.from?.pathname;

let destination = '/';

if (requestedPath?.startsWith('/admin/')) {
  if (isAdmin) {
    destination = requestedPath;
  }
} else if (
  requestedPath === '/admin' &&
  isAdmin
) {
  destination = '/admin/role-permissions';
} else if (
  requestedPath?.startsWith('/manager/') &&
  isManager
) {
  destination = requestedPath;
} else if (
  requestedPath === '/manager' &&
  isManager
) {
  destination = '/manager/dashboard';
} else if (
  requestedPath &&
  !requestedPath.startsWith('/admin') &&
  !requestedPath.startsWith('/manager') &&
  requestedPath.startsWith('/') &&
  !requestedPath.startsWith('//')
) {
  destination = requestedPath;
} else if (isAdmin) {
  destination = '/admin/role-permissions';
} else if (isManager) {
  destination = '/manager/dashboard';
}

navigate(destination, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc email kích hoạt.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">CINEMA WEB</p>
        <h1>Chào mừng trở lại</h1>
        <p className="muted">Đăng nhập để quản lý hồ sơ và trải nghiệm điện ảnh của bạn.</p>

        {location.state?.message && (
          <p className="form-error" role="alert">{location.state.message}</p>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <form onSubmit={submit} className="stack-form">
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="example@domain.com"
              required
            />
          </label>

          <label>
            Mật khẩu
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="form-footer">
          Chưa có tài khoản? <Link to="/register" state={location.state}>Đăng ký ngay</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;