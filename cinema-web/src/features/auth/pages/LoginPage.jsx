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
      const result = await authApi.login({
        email: form.email.trim(),
        password: form.password,
      });
      if (!result?.accessToken) {
        throw new Error('Backend không trả về access token.');
      }
      login(result, result.accessToken);
      navigate(location.state?.from?.pathname || '/');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể đăng nhập. Vui lòng kiểm tra backend và thông tin tài khoản.'));
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
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={submit} className="stack-form">
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Mật khẩu<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          <button className="primary-button" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        </form>
        <p className="form-footer">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
      </div>
    </section>
  );
};

export default LoginPage;