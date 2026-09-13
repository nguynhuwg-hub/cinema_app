export const ENDPOINTS = {
  // Auth Module
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    LOGOUT: '/api/v1/auth/logout',
  },

  // User Module
  USER: {
    PROFILE: '/api/v1/users/me',
    UPDATE_PROFILE: '/api/v1/users/me',
    CHANGE_PASSWORD: '/api/v1/users/me/change-password',
    GET_ALL: '/api/v1/users', // Dành cho Admin
    GET_DETAIL: (id) => `/api/v1/users/${id}`,
    UPDATE_STATUS: (id) => `/api/v1/users/${id}/status`,
    UPDATE_ROLES: (id) => `/api/v1/users/${id}/roles`,
  },

  // Movie Module
  MOVIE: {
    GET_ALL: '/api/v1/movies',
    GET_DETAIL: (id) => `/api/v1/movies/${id}`,
    CREATE: '/api/v1/movies',
    UPDATE: (id) => `/api/v1/movies/${id}`,
    DELETE: (id) => `/api/v1/movies/${id}`,
  },

  // Cinema Module
  CINEMA: {
    GET_ALL: '/api/cinemas',
    GET_DETAIL: (id) => `/api/cinemas/${id}`,
    CREATE: '/api/cinemas',
    UPDATE: (id) => `/api/cinemas/${id}`,
    DELETE: (id) => `/api/cinemas/${id}`,
    BY_CITY: (cityId) => `/api/cinemas/city/${cityId}`,
  },

  CITY: {
    GET_ALL: '/api/cities',
    GET_DETAIL: (id) => `/api/cities/${id}`,
    CREATE: '/api/cities',
    UPDATE: (id) => `/api/cities/${id}`,
    DELETE: (id) => `/api/cities/${id}`,
  },

  GENRE: {
    GET_ALL: '/api/v1/genres',
    CREATE: '/api/v1/genres',
    UPDATE: (id) => `/api/v1/genres/${id}`,
    DELETE: (id) => `/api/v1/genres/${id}`,
  },

  COMMENT: {
    GET_ALL: (movieId) => `/api/v1/movies/${movieId}/comments`,
    CREATE: (movieId) => `/api/v1/movies/${movieId}/comments`,
    DELETE: (movieId, commentId) => `/api/v1/movies/${movieId}/comments/${commentId}`,
  },

  HALL: {
    GET_ALL: '/api/halls',
    GET_DETAIL: (id) => `/api/halls/${id}`,
    BY_CINEMA: (cinemaId) => `/api/halls/cinema/${cinemaId}`,
    CREATE: '/api/halls',
    DELETE: (id) => `/api/halls/${id}`,
  },

  SEAT: {
    BY_HALL: (hallId) => `/api/seats/hall/${hallId}`,
    UPDATE_TYPE: (id) => `/api/seats/${id}/type`,
  },

  SHOWTIME: {
    GET_ALL: '/api/v1/showtimes',
    GET_DETAIL: (id) => `/api/v1/showtimes/${id}`,
    CREATE: '/api/v1/showtimes',
    UPDATE: (id) => `/api/v1/showtimes/${id}`,
    DELETE: (id) => `/api/v1/showtimes/${id}`,
    SEATS: (showtimeId) => `/api/v1/showtimes/${showtimeId}/seats`,
    UPDATE_SEAT_STATUS: (showtimeId) => `/api/v1/showtimes/${showtimeId}/seats/status`,
  },

  NOTIFICATION: {
    GET_MINE: '/api/v1/notifications/me',
    MARK_READ: (id) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/read-all',
    CREATE: '/api/v1/notifications',
  },

  ROLE: {
    GET_ALL: '/api/v1/roles',
  },
};