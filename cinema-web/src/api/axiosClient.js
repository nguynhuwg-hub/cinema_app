import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// 1. Khởi tạo instance của Axios
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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

// 3. Response Interceptor: Chạy sau khi nhận response từ Backend
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp response.data giúp việc gọi API ở các component ngắn gọn hơn
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
        
        // Điều hướng về trang login nếu không ở trang login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // 401: Token hết hạn hoặc chưa gửi Token -> Xóa session và về Login
      if (status === 401) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // 403: Đã đăng nhập nhưng không đủ quyền truy cập API này
      if (status === 403) {
        alert('Bạn không có quyền thực hiện thao tác này!');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;