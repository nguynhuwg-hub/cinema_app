import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// 1. Khởi tạo instance của Axios
const axiosClient = axios.create({
  // Empty base URL keeps browser requests same-origin so Vite proxies /api to Spring Boot.
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Hạn thời gian chờ response (10s)
});

// 2. Request Interceptor: Chạy trước khi gửi bất kỳ request nào lên Backend
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ LocalStorage
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    // Nếu có token, gắn thêm Authorization Header vào Request
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Bắt các lỗi phản hồi chung từ server
    if (error.response) {
      const { status } = error.response;

      // Nếu gặp lỗi 401 (Hết hạn Token hoặc chưa Đăng nhập)
      if (status === 401) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        
        // Auth is intentionally not part of this frontend slice.
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;