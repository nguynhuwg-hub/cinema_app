import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  // 1. Nếu chưa đăng nhập -> Đẩy về trang /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu có yêu cầu Vai trò (Role) và User không thuộc Vai trò đó -> Đẩy về Trang chủ
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // 3. Hợp lệ -> Cho phép truy cập route con (thông qua Outlet)
  return <Outlet />;
};

export default ProtectedRoute;