import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { userApi } from '../api/userApi';
import './ProfilePage.css'; // File CSS custom đính kèm bên dưới

const ProfilePage = () => {
  const { user, login, token } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // 'info' hoặc 'password'

  // State cập nhật thông tin cá nhân
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState({ text: '', type: '' });

  // State đổi mật khẩu
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleInfoChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoMessage({ text: '', type: '' });

    try {
      const updatedUser = await userApi.updateProfile({
        fullName: formData.name,
        phone: formData.phone,
      });
      login(updatedUser, token);
      setInfoMessage({ text: 'Cập nhật thông tin thành công!', type: 'success' });
    } catch (error) {
      setInfoMessage({
        text: error.response?.data?.message || 'Cập nhật thất bại, vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setInfoLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMessage({ text: '', type: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassMessage({ text: 'Mật khẩu mới và xác nhận mật khẩu không khớp!', type: 'error' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPassMessage({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự.', type: 'error' });
      return;
    }

    setPassLoading(true);

    try {
      await userApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPassMessage({ text: 'Đổi mật khẩu thành công!', type: 'success' });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Đổi mật khẩu thất bại, hãy kiểm tra lại mật khẩu hiện tại.';
      setPassMessage({ text: errorMsg, type: 'error' });
    } finally {
      setPassLoading(false);
    }
  };

  // Lấy chữ cái đầu tiên làm Avatar
  const avatarLetter = (formData.name || formData.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="profile-wrapper">
      {/* Header Profile có Hiệu ứng Gradient Glassmorphism */}
      <div className="profile-card profile-header-card">
        <div className="profile-avatar-container">
          <div className="profile-avatar">{avatarLetter}</div>
        </div>
        <div className="profile-user-info">
          <h2>{formData.name || 'Người dùng'}</h2>
          <p className="user-email">{formData.email}</p>
          <span className={`role-badge role-${(user?.role || 'CUSTOMER').toLowerCase()}`}>
            {user?.role || 'CUSTOMER'}
          </span>
        </div>
      </div>

      {/* Thanh Tab Chuyển Đổi với Animation Slide */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Thông tin cá nhân
        </button>
        <button
          className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Đổi mật khẩu
        </button>
      </div>

      {/* Khung Nội Dung Chính với hiệu ứng Fade In */}
      <div className="profile-card profile-content-card">
        {activeTab === 'info' ? (
          <div className="tab-pane fade-in">
            <h3>Cập Nhật Thông Tin</h3>
            {infoMessage.text && (
              <div className={`alert-banner ${infoMessage.type}`}>
                {infoMessage.text}
              </div>
            )}

            <form onSubmit={handleInfoSubmit} className="styled-form">
              <div className="input-group">
                <label>Email (Cố định)</label>
                <input type="email" value={formData.email} disabled className="disabled-input" />
              </div>

              <div className="input-group">
                <label>Họ và tên</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInfoChange}
                  placeholder="Nhập họ và tên..."
                  required
                />
              </div>

              <div className="input-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInfoChange}
                  placeholder="Nhập số điện thoại..."
                />
              </div>

              <button type="submit" disabled={infoLoading} className="glow-button">
                {infoLoading ? <span className="spinner"></span> : 'Lưu Thay Đổi'}
              </button>
            </form>
          </div>
        ) : (
          <div className="tab-pane fade-in">
            <h3>Đổi Mật Khẩu</h3>
            {passMessage.text && (
              <div className={`alert-banner ${passMessage.type}`}>
                {passMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="styled-form">
              <div className="input-group">
                <label>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="input-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Ít nhất 6 ký tự"
                  required
                />
              </div>

              <div className="input-group">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>

              <button type="submit" disabled={passLoading} className="glow-button">
                {passLoading ? <span className="spinner"></span> : 'Cập Nhật Mật Khẩu'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;