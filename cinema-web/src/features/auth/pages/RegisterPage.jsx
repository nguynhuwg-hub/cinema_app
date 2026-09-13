import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi, getApiErrorMessage } from '../api/authApi';

const RegisterPage = () => {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authApi.register({ ...form, email: form.email.trim() });
      setMessage(result?.message || 'Đăng ký thành công. Hãy kiểm tra email để xác thực tài khoản.');
      setTimeout(() => navigate('/login'), 1800);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tạo tài khoản.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">TẠO TÀI KHOẢN</p>
        <h1>Bắt đầu hành trình</h1>
        <p className="muted">Lưu thông tin của bạn cho những lần ghé rạp tiếp theo.</p>
        {message && <p className="form-success">{message}</p>}
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={submit} className="stack-form">
          <label>Họ và tên<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></label>
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Số điện thoại<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Mật khẩu<input type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          <button className="primary-button" disabled={loading}>{loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}</button>
        </form>
        <p className="form-footer">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </div>
    </section>
  );
};

export default RegisterPage;