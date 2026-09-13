import axiosClient from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

const unwrap = (response) => response?.data ?? response;

export const getApiErrorMessage = (error, fallback) => (
  error?.response?.data?.message
  || error?.response?.data?.error
  || error?.message
  || fallback
);

export const authApi = {
  async login(payload) {
    return unwrap(await axiosClient.post(ENDPOINTS.AUTH.LOGIN, payload));
  },
  async register(payload) {
    return unwrap(await axiosClient.post(ENDPOINTS.AUTH.REGISTER, payload));
  },
  async refreshToken(payload) {
    return unwrap(await axiosClient.post(ENDPOINTS.AUTH.REFRESH_TOKEN, payload));
  },
  async verifyEmail(token) {
    return unwrap(await axiosClient.get(ENDPOINTS.AUTH.VERIFY_EMAIL, { params: { token } }));
  },
  async logout() {
    return unwrap(await axiosClient.post(ENDPOINTS.AUTH.LOGOUT));
  },
};