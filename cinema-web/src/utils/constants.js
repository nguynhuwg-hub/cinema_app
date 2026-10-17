// Key dùng để lưu trữ dữ liệu trong LocalStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_INFO: 'user_info',
};

// Định nghĩa vai trò người dùng (phải khớp với Role ở Backend)
export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  CUSTOMER: 'ROLE_CUSTOMER',
  STAFF: 'ROLE_STAFF',
  MANAGER: 'ROLE_MANAGER',
};

// Trạng thái phim
export const MOVIE_STATUS = {
  NOW_SHOWING: 'NOW_SHOWING', // Phim đang chiếu
  COMING_SOON: 'COMING_SOON', // Phim sắp chiếu
  END_SHOWING: 'END_SHOWING', // Phim đã kết thúc
};