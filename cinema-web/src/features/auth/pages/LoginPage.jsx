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
      const originPath = location.state?.from?.pathname || '/';
      navigate(originPath, { replace: true });

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
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </section>
  );
};

export default LoginPage;