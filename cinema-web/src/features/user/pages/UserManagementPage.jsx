import { useState, useEffect } from 'react';
import { notificationApi, roleApi, userApi } from '../api/userApi';
import './UserManagementPage.css';

const statusLabels = {
  ACTIVE: 'Đang hoạt động',
  TEMPORARY_LOCKED: 'Tạm khóa',
  PERMANENT_LOCKED: 'Đã khóa',
  PENDING_VERIFICATION: 'Chờ xác thực',
};

const formatRole = (role) => role.replace(/^ROLE_/, '').replaceAll('_', ' ');

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // States quản lý Drawer/Modal chỉnh sửa User
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ status: '', roleName: '' });

  // States quản lý Modal gửi thông báo
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [noticeUser, setNoticeUser] = useState(null);
  const [notice, setNotice] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, roleData] = await Promise.all([
        userApi.getAllUsers({ page: 0, size: 50, sort: 'createdAt,desc' }),
        roleApi.getAll().catch(() => []),
      ]);
      setUsers(userData?.content || userData || []);
      setRoles(roleData || []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mở Drawer/Modal chỉnh sửa
  const handleEditClick = (user) => {
    setEditingUser(user);
    const currentRole = typeof user.roles?.[0] === 'object' ? user.roles[0].name : (user.roles?.[0] || 'ROLE_CUSTOMER');
    setFormData({ status: user.status || 'ACTIVE', roleName: currentRole });
  };

  // Lưu thông tin sau khi sửa
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (formData.status !== editingUser.status) {
        await userApi.updateStatus(editingUser.id, { status: formData.status });
      }
      if (formData.roleName) {
        await userApi.updateRoles(editingUser.id, { roleNames: [formData.roleName] });
      }
      
      // Cập nhật lại state local
      setUsers(users.map((u) => u.id === editingUser.id ? { ...u, status: formData.status, roles: [formData.roleName] } : u));
      setEditingUser(null);
      alert('Cập nhật người dùng thành công!');
    } catch (err) {
      alert('Có lỗi xảy ra khi cập nhật!');
    }
  };

  // Gửi thông báo
  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await notificationApi.create({
        ...notice,
        userId: noticeUser ? noticeUser.id : null,
      });
      alert('Đã gửi thông báo thành công!');
      setNotice({ title: '', content: '' });
      setIsNotifyOpen(false);
    } catch (err) {
      alert('Gửi thông báo thất bại!');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div className="admin-page user-management-page">
      <div className="user-management-heading">
        <div>
          <p className="eyebrow">IDENTITY & ACCESS</p>
          <h1>Khách hàng & tài khoản</h1>
          <p>Theo dõi quyền truy cập, trạng thái thành viên và gửi thông báo từ một nơi.</p>
        </div>
        <button className="user-primary-button" onClick={() => { setNoticeUser(null); setIsNotifyOpen(true); }}>
          <span aria-hidden="true">✉</span> Gửi thông báo
        </button>
      </div>

      <div className="user-stats-grid">
        <article className="user-stat-card"><span className="user-stat-icon members">♙</span><div><small>TÀI KHOẢN ĐANG HIỂN THỊ</small><strong>{filteredUsers.length}</strong><span>trên trang hiện tại</span></div></article>
        <article className="user-stat-card"><span className="user-stat-icon active">✓</span><div><small>ĐANG HOẠT ĐỘNG</small><strong>{filteredUsers.filter((userItem) => (userItem.status || 'ACTIVE') === 'ACTIVE').length}</strong><span>tài khoản sẵn sàng</span></div></article>
        <article className="user-stat-card"><span className="user-stat-icon roles">◇</span><div><small>VAI TRÒ HỆ THỐNG</small><strong>{roles.length}</strong><span>nhóm quyền khả dụng</span></div></article>
      </div>

      <section className="user-directory">
        <div className="user-directory-toolbar">
          <div><p className="user-directory-kicker">DIRECTORY</p><h2>Danh sách tài khoản</h2></div>
          <label className="user-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Tìm theo tên hoặc email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Tìm người dùng theo tên hoặc email"
            />
            <kbd>⌕</kbd>
          </label>
        </div>
        <div className="user-table-wrap">
        <table className="user-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Trạng thái</th>
              <th>Vai trò</th>
              <th className="user-actions-heading">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const roleName = typeof u.roles?.[0] === 'object' ? u.roles[0].name : (u.roles?.[0] || 'ROLE_CUSTOMER');
              const status = u.status || 'ACTIVE';
              return (
                <tr key={u.id}>
                  <td>
                    <div className="user-info">
                      <span className="user-table-avatar">{(u.fullName || u.email || 'U').slice(0, 1).toUpperCase()}</span>
                      <span><strong>{u.fullName || 'Chưa cập nhật tên'}</strong><small>{u.email}</small></span>
                    </div>
                  </td>
                  <td>
                    <span className={`user-status-badge status-${status.toLowerCase()}`}>
                      <i />{statusLabels[status] || status.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="user-role-badge"><i aria-hidden="true">◇</i>{formatRole(roleName)}</span>
                  </td>
                  <td className="user-row-actions">
                    <button className="user-icon-button" title={`Gửi thông báo tới ${u.fullName || u.email}`} aria-label={`Gửi thông báo tới ${u.fullName || u.email}`} onClick={() => { setNoticeUser(u); setIsNotifyOpen(true); }}>
                      ✉
                    </button>
                    <button className="user-edit-button" onClick={() => handleEditClick(u)}>
                      Chỉnh sửa <span aria-hidden="true">↗</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {!filteredUsers.length && <tr><td colSpan="4"><div className="user-empty-state"><span>⌕</span><strong>Không tìm thấy tài khoản</strong><small>Thử tìm bằng tên hoặc email khác.</small></div></td></tr>}
          </tbody>
        </table>
        </div>
        <div className="user-directory-footer"><span>Đang hiển thị <strong>{filteredUsers.length}</strong> tài khoản</span><span>Quyền truy cập được quản lý an toàn</span></div>
      </section>

      {editingUser && (
        <div className="user-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-heading"><span className="user-modal-icon">♙</span><div><p>ACCOUNT SETTINGS</p><h3>Chỉnh sửa tài khoản</h3><small>{editingUser.fullName} · {editingUser.email}</small></div><button type="button" aria-label="Đóng" onClick={() => setEditingUser(null)}>×</button></div>
            <form onSubmit={handleSaveUser}>
              <div className="user-form-group">
                <label>Trạng thái tài khoản<small>Quyết định quyền truy cập của thành viên</small></label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="ACTIVE">ACTIVE (Hoạt động)</option>
                  <option value="TEMPORARY_LOCKED">TEMPORARY_LOCKED (Tạm khóa)</option>
                  <option value="PERMANENT_LOCKED">PERMANENT_LOCKED (Khóa vĩnh viễn)</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION (Chờ xác thực)</option>
                </select>
              </div>

              <div className="user-form-group">
                <label>Vai trò<small>Nhóm quyền trong hệ thống</small></label>
                <select value={formData.roleName} onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}>
                  {roles.map((r) => (
                    <option key={r.id || r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="user-modal-actions">
                <button type="button" className="user-cancel-button" onClick={() => setEditingUser(null)}>Hủy</button>
                <button type="submit" className="user-primary-button">Lưu thay đổi <span aria-hidden="true">→</span></button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNotifyOpen && (
        <div className="user-modal-overlay" onClick={() => setIsNotifyOpen(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="user-modal-heading"><span className="user-modal-icon">✉</span><div><p>MESSAGE CENTER</p><h3>Gửi thông báo</h3><small>{noticeUser ? `Người nhận: ${noticeUser.fullName || noticeUser.email}` : 'Gửi tới tất cả người dùng'}</small></div><button type="button" aria-label="Đóng" onClick={() => setIsNotifyOpen(false)}>×</button></div>
            <form onSubmit={handleSendNotification}>
              <div className="user-form-group">
                <label>Tiêu đề<small>Viết ngắn gọn để người nhận dễ nắm bắt</small></label>
                <input type="text" value={notice.title} onChange={(e) => setNotice({ ...notice, title: e.target.value })} required />
              </div>
              <div className="user-form-group">
                <label>Nội dung<small>Thông tin chi tiết gửi đến thành viên</small></label>
                <textarea rows="4" value={notice.content} onChange={(e) => setNotice({ ...notice, content: e.target.value })} required />
              </div>
              <div className="user-modal-actions">
                <button type="button" className="user-cancel-button" onClick={() => setIsNotifyOpen(false)}>Hủy</button>
                <button type="submit" className="user-primary-button">Gửi thông báo <span aria-hidden="true">→</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    );
};

export default UserManagementPage;