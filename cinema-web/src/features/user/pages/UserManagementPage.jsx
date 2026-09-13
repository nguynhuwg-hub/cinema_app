import { useState, useEffect } from 'react';
import { notificationApi, roleApi, userApi } from '../api/userApi';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [notice, setNotice] = useState({ userId: '', title: '', content: '' });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userApi.getAllUsers({ page: 0, size: 50, sort: 'createdAt,desc' });
        setUsers(data?.content || data || []);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    roleApi.getAll().then(setRoles).catch(() => setRoles([]));
  }, []);

  const updateStatus = async (id, status) => { await userApi.updateStatus(id, { status }); setUsers(users.map((user) => user.id === id ? { ...user, status } : user)); };
  const updateRoles = async (id, roleNames) => { await userApi.updateRoles(id, { roleNames }); setUsers(users.map((user) => user.id === id ? { ...user, roles: roleNames } : user)); };
  const sendNotification = async (event) => { event.preventDefault(); await notificationApi.create({ ...notice, userId: notice.userId ? Number(notice.userId) : null }); setNotice({ userId: '', title: '', content: '' }); };

  if (loading) return <div>Đang tải danh sách người dùng...</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><p className="eyebrow">IDENTITY & ACCESS</p><h1>Quản lý người dùng</h1></div>
      <form className="admin-form notification-form" onSubmit={sendNotification}><h2>Gửi thông báo</h2><div className="form-grid"><input placeholder="User ID (để trống = tất cả)" value={notice.userId} onChange={(e) => setNotice({ ...notice, userId: e.target.value })} /><input placeholder="Tiêu đề" value={notice.title} onChange={(e) => setNotice({ ...notice, title: e.target.value })} required /></div><textarea placeholder="Nội dung" value={notice.content} onChange={(e) => setNotice({ ...notice, content: e.target.value })} required /><button className="primary-button">Gửi thông báo</button></form>
      <div className="admin-table-wrap"><table className="admin-table">
        <thead>
          <tr style={{ background: '#343a40', color: '#fff', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>ID</th>
            <th style={{ padding: '0.75rem' }}>Họ và tên</th>
            <th style={{ padding: '0.75rem' }}>Email</th>
            <th>Trạng thái</th><th>Vai trò</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid #dee2e6' }}>
              <td>{u.id}</td><td><strong>{u.fullName}</strong><small>{u.email}</small></td><td><select value={u.status} onChange={(e) => updateStatus(u.id, e.target.value)}><option value="ACTIVE">ACTIVE</option><option value="TEMPORARY_LOCKED">TEMPORARY_LOCKED</option><option value="PERMANENT_LOCKED">PERMANENT_LOCKED</option><option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option></select></td><td><select value={u.roles?.[0]?.name || u.roles?.[0] || 'ROLE_CUSTOMER'} onChange={(e) => updateRoles(u.id, [e.target.value])}>{roles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}</select></td>
            </tr>
          ))}
        </tbody>
      </table>
        </div>
      </div>
  );
};

export default UserManagementPage;