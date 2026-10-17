import { Link } from 'react-router-dom';

const modules = [
  { number: '01', icon: '▣', title: 'Phim & thể loại', detail: 'Biên tập danh mục phim, thông tin phát hành và thể loại.', path: '/admin/movies', color: 'coral' },
  { number: '02', icon: '✎', title: 'Quản lý bài đánh giá phim', detail: 'Viết, chỉnh sửa và gắn bài đánh giá với phim.', path: '/admin/reviews', color: 'blue' },
  { number: '03', icon: '⌂', title: 'Rạp & phòng chiếu', detail: 'Quản lý cụm rạp, phòng, sơ đồ và cấu hình ghế.', path: '/admin/cinemas', color: 'gold' },
  { number: '04', icon: '◷', title: 'Lịch suất chiếu', detail: 'Sắp xếp lịch trình và cập nhật giá vé theo suất.', path: '/admin/showtimes', color: 'green' },
  { number: '05', icon: '♙', title: 'Tài khoản khách hàng', detail: 'Theo dõi vai trò, trạng thái và gửi thông báo.', path: '/admin/users', color: 'coral' },
];

const AdminDashboardPage = () => (
  <div className="admin-page admin-overview">
    <section className="admin-welcome">
      <div>
        <p className="admin-eyebrow">CINEF MANAGEMENT SUITE</p>
        <h1>Trung tâm<br /><span>điều hành.</span></h1>
        <p>Chọn khu vực bạn muốn quản lý. Mọi thay đổi được cập nhật qua hệ thống hiện tại của rạp.</p>
      </div>
      <div className="admin-welcome-art" aria-hidden="true"><span>✦</span><i /><i /><i /></div>
      <div className="admin-welcome-note"><span className="admin-status-dot" /> KHU VỰC DÀNH RIÊNG CHO ADMIN</div>
    </section>
    <div className="admin-section-heading"><div><p className="admin-eyebrow">WORKSPACES</p><h2>Khu vực quản lý</h2></div><span>05 MODULE</span></div>
    <div className="admin-link-grid">
      {modules.map((module) => (
        <Link to={module.path} className={`admin-module ${module.color}`} key={module.number}>
          <div className="admin-module-top"><span className="admin-module-icon">{module.icon}</span><span className="admin-module-number">{module.number}</span></div>
          <h3>{module.title}</h3><p>{module.detail}</p>
          <span className="admin-module-action">Mở khu vực <span aria-hidden="true">↗</span></span>
        </Link>
      ))}
    </div>
    <p className="admin-overview-footnote">Đây là không gian quản trị riêng. Giao diện khách hàng và các dịch vụ không xuất hiện trong khu vực này.</p>
  </div>
);
export default AdminDashboardPage;
