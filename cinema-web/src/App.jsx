import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import { ROLES } from './utils/constants';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Giao diện dành cho Khách & User (Dùng MainLayout) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<div>Trang Chủ - Danh Sách Phim</div>} />
            <Route path="/login" element={<div>Trang Đăng Nhập</div>} />
            <Route path="/register" element={<div>Trang Đăng Ký</div>} />
            <Route path="/movies/:id" element={<div>Trang Chi Tiết Phim</div>} />
            <Route path="/cinemas" element={<div>Trang Cụm Rạp</div>} />

            {/* Trang cần Đăng nhập */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<div>Trang Thông Tin Cá Nhân</div>} />
            </Route>
          </Route>

          {/* Giao diện dành cho Admin (Dùng AdminLayout) */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<div>Trang Dashboard Tổng Quan</div>} />
              <Route path="/admin/movies" element={<div>Trang Quản Lý Phim</div>} />
              <Route path="/admin/cinemas" element={<div>Trang Quản Lý Rạp</div>} />
              <Route path="/admin/users" element={<div>Trang Quản Lý Người Dùng</div>} />
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;