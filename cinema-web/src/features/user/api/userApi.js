import axiosClient from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

export const userApi = {
  // Lấy thông tin cá nhân của User đang đăng nhập
  getProfile: () => {
    return axiosClient.get(ENDPOINTS.USER.PROFILE);
  },

  // Cập nhật thông tin cá nhân
  updateProfile: (data) => {
    return axiosClient.put(ENDPOINTS.USER.UPDATE_PROFILE, data);
  },

  // Đổi mật khẩu
  changePassword: (data) => {
    return axiosClient.put(ENDPOINTS.USER.CHANGE_PASSWORD, data);
  },

  // Lấy danh sách tất cả người dùng (Dành cho Admin)
  getAllUsers: (params = {}) => {
    return axiosClient.get(ENDPOINTS.USER.GET_ALL, { params });
  },
  getById: (id) => axiosClient.get(ENDPOINTS.USER.GET_DETAIL(id)),
  updateStatus: (id, payload) => axiosClient.patch(ENDPOINTS.USER.UPDATE_STATUS(id), payload),
  updateRoles: (id, payload) => axiosClient.put(ENDPOINTS.USER.UPDATE_ROLES(id), payload),
};

export const notificationApi = {
  getMine: (params = {}) => axiosClient.get(ENDPOINTS.NOTIFICATION.GET_MINE, { params }),
  markRead: (id) => axiosClient.patch(ENDPOINTS.NOTIFICATION.MARK_READ(id)),
  markAllRead: () => axiosClient.patch(ENDPOINTS.NOTIFICATION.MARK_ALL_READ),
  create: (payload) => axiosClient.post(ENDPOINTS.NOTIFICATION.CREATE, payload),
};

export const roleApi = {
  getAll: () => axiosClient.get(ENDPOINTS.ROLE.GET_ALL),
};