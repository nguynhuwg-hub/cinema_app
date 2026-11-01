
import { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { refreshSessionOnce } from '../features/auth/api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    localStorage.removeItem('refreshToken');
  };

  // Khôi phục phiên bằng dữ liệu mới từ backend
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        if (active) {
          clearSession();
          setLoading(false);
        }
        return;
      }

      try {
        const result = await refreshSessionOnce(refreshToken);

        if (!result?.accessToken || !result?.refreshToken) {
          throw new Error('Không thể khôi phục phiên đăng nhập');
        }

        if (!active) return;

        localStorage.setItem(
          STORAGE_KEYS.ACCESS_TOKEN,
          result.accessToken
        );

        localStorage.setItem(
          STORAGE_KEYS.USER_INFO,
          JSON.stringify(result)
        );

        localStorage.setItem(
          'refreshToken',
          result.refreshToken
        );

        setToken(result.accessToken);
        setUser(result);
      } catch (error) {
        console.error('Không thể khôi phục phiên:', error);

        if (active) clearSession();
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(
      STORAGE_KEYS.USER_INFO,
      JSON.stringify(userData)
    );

    if (userData.refreshToken) {
      localStorage.setItem('refreshToken', userData.refreshToken);
    }
  };

  // Chỉ cập nhật dữ liệu hồ sơ, giữ nguyên Role/Permission
  const updateUserProfile = (profile) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      const updatedUser = {
        ...currentUser,
        fullName: profile.fullName ?? currentUser.fullName,
        phone: profile.phone ?? currentUser.phone,
      };

      localStorage.setItem(
        STORAGE_KEYS.USER_INFO,
        JSON.stringify(updatedUser)
      );

      return updatedUser;
    });
  };

  const logout = () => {
    clearSession();
  };

  const hasRole = (role) => {
    const roles = user?.roles ?? user?.role ?? [];
    const normalizedRoles = Array.isArray(roles)
      ? roles
      : [roles];

    const expectedRole = role.startsWith('ROLE_')
      ? role
      : `ROLE_${role}`;

    return normalizedRoles.some((item) => {
      const value = typeof item === 'string'
        ? item
        : item?.name;

      return value === expectedRole ||
        value === expectedRole.replace('ROLE_', '');
    });
  };

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
        loading,
        isAuthenticated: !!token,
        isAdmin: hasRole('ADMIN'),
        hasRole,
        hasPermission,
        login,
        logout,
        updateUserProfile,
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
