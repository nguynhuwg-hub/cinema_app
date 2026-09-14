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
    setMessage('');

    try {
      const response = await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });

      // Hiển thị thông báo yêu cầu kích hoạt email trả về từ backend
      const successMsg = response?.message || 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.';
      setMessage(successMsg);

      // Chuyển hướng người dùng về trang Login sau 3 giây để họ tiến hành đăng nhập sau khi xác thực
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tạo tài khoản. Vui lòng kiểm tra thông tin nhập vào.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">TẠO TÀI KHOẢN</p>
        <h1>Bắt đầu hành trình</h1>
        <p className="muted">Đăng ký để lưu lại lịch sử đặt vé và nhận ưu đãi từ rạp chiếu.</p>

        {message && <p className="form-success" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        <form onSubmit={submit} className="stack-form">
          <label>
            Họ và tên
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
              required
            />
          </label>

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
            Số điện thoại
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0912345678"
            />
          </label>

          <label>
            Mật khẩu
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Ít nhất 6 ký tự"
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p className="form-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;