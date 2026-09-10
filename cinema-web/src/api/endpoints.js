export const ENDPOINTS = {
  // Auth Module
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  },

  // User Module
  USER: {
    PROFILE: '/api/v1/users/profile',
    UPDATE_PROFILE: '/api/v1/users/profile',
    CHANGE_PASSWORD: '/api/v1/users/change-password',
    GET_ALL: '/api/v1/users', // Dành cho Admin
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
    GET_ALL: '/api/v1/cinemas',
    GET_DETAIL: (id) => `/api/v1/cinemas/${id}`,
    GET_SHOWTIMES: (id) => `/api/v1/cinemas/${id}/showtimes`,
  },
};