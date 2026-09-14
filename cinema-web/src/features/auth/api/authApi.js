import axiosClient from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

/**
 * Bóc tách dữ liệu từ phản hồi của Axios & Backend
 * Xử lý trường hợp Backend trả về dạng bọc ApiResponse { status, message, data }
 */
const unwrap = (response) => {
  const payload = response?.data ?? response;
  // Nếu backend bọc dữ liệu trong thuộc tính `data` của ApiResponse, lấy tầng inner data
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

/**
 * Trích xuất câu thông báo lỗi chi tiết từ Axios Error Response
 */
export const getApiErrorMessage = (error, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') => (
  error?.response?.data?.message
  || error?.response?.data?.error
  || error?.message
  || fallback
);

export const authApi = {
  /**
   * Đăng nhập
   * @param {{ email: string, password: string }} payload
   */
  async login(payload) {
    const response = await axiosClient.post(ENDPOINTS.AUTH.LOGIN, payload);
    return unwrap(response);
  },

  /**
   * Đăng ký tài khoản
   * @param {{ fullName: string, email: string, phone?: string, password: string }} payload
   */
  async register(payload) {
    const response = await axiosClient.post(ENDPOINTS.AUTH.REGISTER, payload);
    // Trả về cả bọc payload để RegisterPage lấy được thuộc tính message kích hoạt email
    return response?.data ?? response;
  },

  /**
   * Cấp lại Access Token mới từ Refresh Token
   * @param {string | { refreshToken: string }} refreshTokenOrPayload
   */
  async refreshToken(refreshTokenOrPayload) {
    const payload = typeof refreshTokenOrPayload === 'string'
      ? { refreshToken: refreshTokenOrPayload }
      : refreshTokenOrPayload;

    const response = await axiosClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN, payload);
    return unwrap(response);
  },

  /**
   * Kích hoạt tài khoản bằng Token gửi qua Email
   * @param {string} token
   */
  async verifyEmail(token) {
    const response = await axiosClient.get(ENDPOINTS.AUTH.VERIFY_EMAIL, { params: { token } });
    return response?.data ?? response;
  },

  /**
   * Đăng xuất
   */
  async logout() {
    const response = await axiosClient.post(ENDPOINTS.AUTH.LOGOUT);
    return unwrap(response);
  },
};