import { useEffect, useState } from 'react';
import { notificationApi, roleApi, userApi } from '../api/userApi';
import './UserManagementPage.css';

const statusLabels = {
  ACTIVE: 'Đang hoạt động',
  TEMPORARY_LOCKED: 'Tạm khóa',
  PERMANENT_LOCKED: 'Đã khóa',
  PENDING_VERIFICATION: 'Chờ xác thực',
};

const formatRole = (role = '') => String(role).replace(/^ROLE_/, '').replaceAll('_', ' ');
const roleNameOf = (user) => {
  const role = user.roles?.[0];
  return typeof role === 'object' && role !== null ? role.name : role || 'ROLE_CUSTOMER';
};

const normalizeRoles = (roles = []) => {
  if (!Array.isArray(roles)) return [];

  return [...new Set(
    roles
      .map((role) =>
        typeof role === 'string' ? role : role?.name
      )
      .filter(Boolean)
  )];
};

const sameRoles = (a, b) => {
  const left = [...normalizeRoles(a)].sort();
  const right = [...normalizeRoles(b)].sort();

  return (
    left.length === right.length &&
    left.every((role, index) => role === right[index])
  );
};


const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
  status: '',
  roleNames: []
});


const [savingUser, setSavingUser] = useState(false);

  // States quản lý Modal gửi thông báo
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [noticeUser, setNoticeUser] = useState(null);
  const [notice, setNotice] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [userData, roleData] = await Promise.all([
        userApi.getAllUsers({ page: 0, size: 50, sort: 'createdAt,desc' }),
        roleApi.getAll().catch(() => []),
      ]);
      const userList = userData?.content ?? userData ?? [];
      const roleList = roleData?.content ?? roleData ?? [];
      setUsers(Array.isArray(userList) ? userList : []);
      setRoles(Array.isArray(roleList) ? roleList : []);
    } catch (error) {
      console.error('Lỗi tải danh sách người dùng:', error);
      setLoadError('Không thể tải danh sách người dùng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mở Drawer/Modal chỉnh sửa
  
const handleEditClick = (user) => {
  setEditingUser(user);

  setFormData({
    status: user.status,
    roleNames: normalizeRoles(user.roles)
  });
};


const handleRoleToggle = (roleName) => {
  setFormData((prev) => {
    const exists = prev.roleNames.includes(roleName);

    return {
      ...prev,
      roleNames: exists
        ? prev.roleNames.filter((name) => name !== roleName)
        : [...prev.roleNames, roleName]
    };
  });
};


  // Lưu thông tin sau khi sửa
  
const handleSaveUser = async (e) => {
  e.preventDefault();

  if (!editingUser || savingUser) return;

  const originalRoles = normalizeRoles(editingUser.roles);
  const selectedRoles = normalizeRoles(formData.roleNames);

  const statusChanged =
    formData.status !== editingUser.status;

  const rolesChanged =
    !sameRoles(originalRoles, selectedRoles);

  if (!statusChanged && !rolesChanged) {
    setEditingUser(null);
    return;
  }

  if (selectedRoles.length === 0) {
    alert('Tài khoản phải có ít nhất một vai trò.');
    return;
  }

  setSavingUser(true);

  try {
    // Thay đổi Role trước, nếu thực sự có thay đổi.
    // Backend phải kiểm tra bảo vệ ADMIN cuối cùng.
    if (rolesChanged) {
      await userApi.updateRoles(editingUser.id, {
        roleNames: selectedRoles
      });
    }

    // Chỉ cập nhật trạng thái khi thực sự thay đổi.
    if (statusChanged) {
      await userApi.updateStatus(editingUser.id, {
        status: formData.status
      });
    }

    // Lấy lại dữ liệu từ server thay vì tự tạo dữ liệu.
    await fetchData();

    setEditingUser(null);
    alert('Cập nhật tài khoản thành công!');
  } catch (error) {
    console.error('Cập nhật tài khoản thất bại:', error);

    // Hai API không nằm trong cùng một transaction.
    // Nếu một API thành công và API sau thất bại,
    // cần tải lại dữ liệu để biết trạng thái thực tế.
    try {
      await fetchData();
    } catch (reloadError) {
      console.error('Không thể tải lại tài khoản:', reloadError);
    }

    alert(
      'Không thể hoàn tất cập nhật. ' +
      'Một phần thay đổi có thể đã được lưu. ' +
      'Hãy kiểm tra lại dữ liệu trước khi thử lại.'
    );
  } finally {
    setSavingUser(false);
  }
};


  const openNotification = (user = null) => {
    setNoticeUser(user);
    setNotice({ title: '', content: '' });
    setIsNotifyOpen(true);
  };

  const handleSendNotification = async (event) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await notificationApi.create({
        title: notice.title.trim(),
        content: notice.content.trim(),
        userId: noticeUser ? noticeUser.id : null,
      });
      alert('Đã gửi thông báo thành công!');
      setNotice({ title: '', content: '' });
      setIsNotifyOpen(false);
    } catch (error) {
      console.error('Lỗi gửi thông báo:', error);
      alert('Gửi thông báo thất bại!');
    } finally {
      setSending(false);
    }
  };

  const query = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    (user.fullName || '').toLowerCase().includes(query) ||
    (user.email || '').toLowerCase().includes(query)
  );

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <div className="admin-page user-management-page">
      <div className="user-management-heading">
        <div>
          <p className="eyebrow">IDENTITY &amp; ACCESS</p>
          <h1>Khách hàng &amp; tài khoản</h1>
          <p>Theo dõi quyền truy cập, trạng thái thành viên và gửi thông báo từ một nơi.</p>
        </div>
        <button type="button" className="user-primary-button" onClick={() => openNotification()}>
          <span aria-hidden="true">✉</span> Gửi thông báo
        </button>
      </div>

      {loadError && <p className="form-error" role="alert">{loadError} <button type="button" onClick={fetchData}>Thử lại</button></p>}

      <div className="user-stats-grid">
        <article className="user-stat-card">
          <span className="user-stat-icon members">♙</span>
          <div><small>TÀI KHOẢN ĐANG HIỂN THỊ</small><strong>{filteredUsers.length}</strong><span>trên trang hiện tại</span></div>
        </article>
        <article className="user-stat-card">
          <span className="user-stat-icon active">✓</span>
          <div><small>ĐANG HOẠT ĐỘNG</small><strong>{filteredUsers.filter((user) => (user.status || 'ACTIVE') === 'ACTIVE').length}</strong><span>tài khoản sẵn sàng</span></div>
        </article>
        <article className="user-stat-card">
          <span className="user-stat-icon roles">◇</span>
          <div><small>VAI TRÒ HỆ THỐNG</small><strong>{roles.length}</strong><span>nhóm quyền khả dụng</span></div>
        </article>
      </div>

      <section className="user-directory">
        <div className="user-directory-toolbar">
          <div><p className="user-directory-kicker">DIRECTORY</p><h2>Danh sách tài khoản</h2></div>
          <label className="user-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Tìm theo tên hoặc email" value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)} aria-label="Tìm người dùng theo tên hoặc email" />
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
  <div className="user-role-list">
    {normalizeRoles(u.roles).map((roleName) => (
      <span
        key={roleName}
        className="user-role-badge"
      >
        <i aria-hidden="true">◇</i>
        {formatRole(roleName)}
      </span>
    ))}
  </div>
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
        <div className="user-modal-overlay" onClick={() => !saving && setEditingUser(null)}>
          <div className="user-modal" role="dialog" aria-modal="true" aria-label="Chỉnh sửa tài khoản" onClick={(event) => event.stopPropagation()}>
            <div className="user-modal-heading">
              <span className="user-modal-icon">♙</span>
              <div><p>ACCOUNT SETTINGS</p><h3>Chỉnh sửa tài khoản</h3><small>{editingUser.fullName} · {editingUser.email}</small></div>
              <button type="button" aria-label="Đóng" disabled={saving} onClick={() => setEditingUser(null)}>×</button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="user-form-group">
                <label htmlFor="edit-user-status">Trạng thái tài khoản <small>Quyết định quyền truy cập của thành viên</small></label>
                <select id="edit-user-status" value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })}>
                  <option value="ACTIVE">ACTIVE (Hoạt động)</option>
                  <option value="TEMPORARY_LOCKED">TEMPORARY_LOCKED (Tạm khóa)</option>
                  <option value="PERMANENT_LOCKED">PERMANENT_LOCKED (Khóa vĩnh viễn)</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION (Chờ xác thực)</option>
                </select>
              </div>

             
<div className="user-form-group">
  <label>
    Vai trò tài khoản
    <small>
      Có thể lựa chọn nhiều vai trò cho một tài khoản
    </small>
  </label>

  <div className="user-role-selector">
    {roles.map((role) => {
      const checked =
        formData.roleNames.includes(role.name);

      return (
        <label
          key={role.id || role.name}
          className={`user-role-option ${
            checked ? 'selected' : ''
          }`}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={savingUser}
            onChange={() =>
              handleRoleToggle(role.name)
            }
          />

          <span className="user-role-option-content">
            <strong>
              {formatRole(role.name)}
            </strong>

            <small>
              {role.name}
            </small>
          </span>
        </label>
      );
    })}
  </div>

  <p className="user-role-hint">
    Đã chọn {formData.roleNames.length} vai trò
  </p>
</div>

              <div className="user-modal-actions">
                <button type="button" className="user-cancel-button" onClick={() => setEditingUser(null)}>Hủy</button>
                <button
  type="submit"
  className="user-primary-button"
  disabled={savingUser || formData.roleNames.length === 0}
>
  {savingUser ? 'Đang lưu...' : 'Lưu thay đổi'}
  <span aria-hidden="true"> →</span>
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNotifyOpen && (
        <div className="user-modal-overlay" onClick={() => !sending && setIsNotifyOpen(false)}>
          <div className="user-modal" role="dialog" aria-modal="true" aria-label="Gửi thông báo" onClick={(event) => event.stopPropagation()}>
            <div className="user-modal-heading">
              <span className="user-modal-icon">✉</span>
              <div><p>MESSAGE CENTER</p><h3>Gửi thông báo</h3><small>{noticeUser ? `Người nhận: ${noticeUser.fullName || noticeUser.email}` : 'Gửi tới tất cả người dùng'}</small></div>
              <button type="button" aria-label="Đóng" disabled={sending} onClick={() => setIsNotifyOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSendNotification}>
              <div className="user-form-group">
                <label htmlFor="notice-title">Tiêu đề <small>Viết ngắn gọn để người nhận dễ nắm bắt</small></label>
                <input id="notice-title" type="text" value={notice.title} onChange={(event) => setNotice({ ...notice, title: event.target.value })} required />
              </div>
              <div className="user-form-group">
                <label htmlFor="notice-content">Nội dung <small>Thông tin chi tiết gửi đến thành viên</small></label>
                <textarea id="notice-content" rows={4} value={notice.content} onChange={(event) => setNotice({ ...notice, content: event.target.value })} required />
              </div>
              <div className="user-modal-actions">
                <button type="button" className="user-cancel-button" disabled={sending} onClick={() => setIsNotifyOpen(false)}>Hủy</button>
                <button type="submit" className="user-primary-button" disabled={sending}>{sending ? 'Đang gửi...' : 'Gửi thông báo'} <span aria-hidden="true">→</span></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default UserManagementPage;
