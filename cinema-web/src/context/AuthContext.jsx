import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Lỗi khi đọc thông tin user:', error);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
      }
    }

    setLoading(false);
  }, []);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem('refreshToken');
  };

  // Kiểm tra Role
  const hasRole = (role) => {
    const roles = user?.roles ?? user?.role ?? [];
    const normalizedRoles = Array.isArray(roles) ? roles : [roles];

    const expectedRole = role.startsWith('ROLE_')
      ? role
      : `ROLE_${role}`;

    return normalizedRoles.some((item) => {
      const value = typeof item === 'string' ? item : item?.name;

      return value === expectedRole ||
             value === expectedRole.replace('ROLE_', '');
    });
  };

  // Kiểm tra Permission
  const hasPermission = (permissionCode) => {
    const permissions = user?.permissions ?? [];

    return permissions.some((permission) => {
      const code = typeof permission === 'string'
        ? permission
        : permission?.code;

      return code === permissionCode;
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
        hasPermission,
        loading,
        login,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }

  return context;
};