import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

// Khởi tạo Context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục thông tin từ LocalStorage khi ứng dụng khởi chạy
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Lỗi khi đọc thông tin user từ localStorage:', error);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      }
    }
    setLoading(false);
  }, []);

  // Hàm xử lý Đăng nhập thành công
  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userData));
  };

  // Hàm xử lý Đăng xuất
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
  };

  const hasRole = (role) => {
    const roles = user?.roles || user?.role || [];
    const normalizedRoles = Array.isArray(roles) ? roles : [roles];
    return normalizedRoles.some((item) => {
      const value = typeof item === 'string' ? item : item?.name;
      return value === role || value === `ROLE_${role}`;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: hasRole('ADMIN'),
        hasRole,
        loading,
        login,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook để gọi AuthContext nhanh hơn ở các component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};