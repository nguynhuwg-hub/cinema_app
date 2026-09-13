import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { userApi } from '../api/userApi';

const ProfilePage = () => {
  const { user, login, token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Gọi API cập nhật
      const updatedUser = await userApi.updateProfile({ fullName: formData.name, phone: formData.phone });
      // Cập nhật lại State toàn cục trong AuthContext
      login(updatedUser, token);
      setMessage('Cập nhật thông tin thành công!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Cập nhật thất bại, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-panel">
      <h2>Thông tin cá nhân</h2>
      {message && <p style={{ color: message.includes('thành công') ? 'green' : 'red' }}>{message}</p>}

      <form onSubmit={handleSubmit} className="stack-form">
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email (Không thể sửa)</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Họ và tên</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Số điện thoại</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="primary-button"
        >
          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;