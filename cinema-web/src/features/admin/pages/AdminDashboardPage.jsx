import { Link } from 'react-router-dom';

const AdminDashboardPage = () => (
  <div className="admin-page">
    <div className="admin-page-heading"><p className="eyebrow">CINEF CONTROL ROOM</p><h1>Tổng quan hệ thống</h1><p className="muted">Quản lý nội dung, rạp chiếu, lịch chiếu và tài khoản từ một nơi.</p></div>
    <div className="admin-link-grid">
      <Link to="/admin/movies" className="admin-module"><span>01</span><h2>Phim & thể loại</h2><p>Tạo, chỉnh sửa, cập nhật trạng thái và quản lý thể loại phim.</p></Link>
      <Link to="/admin/cinemas" className="admin-module"><span>02</span><h2>Cụm rạp & phòng</h2><p>Quản lý thành phố, cụm rạp, phòng chiếu và loại ghế.</p></Link>
      <Link to="/admin/showtimes" className="admin-module"><span>03</span><h2>Suất chiếu</h2><p>Lên lịch suất chiếu và theo dõi trạng thái sơ đồ ghế.</p></Link>
      <Link to="/admin/users" className="admin-module"><span>04</span><h2>Tài khoản</h2><p>Kiểm soát trạng thái, role và thông báo người dùng.</p></Link>
    </div>
  </div>
);
export default AdminDashboardPage;
