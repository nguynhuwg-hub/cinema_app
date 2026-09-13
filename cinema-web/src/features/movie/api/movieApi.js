import axiosClient from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

export const movieApi = {
  getAll: (params = {}) => axiosClient.get(ENDPOINTS.MOVIE.GET_ALL, { params }),
  getById: (id) => axiosClient.get(ENDPOINTS.MOVIE.GET_DETAIL(id)),
  create: (payload) => axiosClient.post(ENDPOINTS.MOVIE.CREATE, payload),
  update: (id, payload) => axiosClient.put(ENDPOINTS.MOVIE.UPDATE(id), payload),
  remove: (id) => axiosClient.delete(ENDPOINTS.MOVIE.DELETE(id)),
};

export const genreApi = {
  getAll: () => axiosClient.get(ENDPOINTS.GENRE.GET_ALL),
  create: (payload) => axiosClient.post(ENDPOINTS.GENRE.CREATE, payload),
  update: (id, payload) => axiosClient.put(ENDPOINTS.GENRE.UPDATE(id), payload),
  remove: (id) => axiosClient.delete(ENDPOINTS.GENRE.DELETE(id)),
};

export const commentApi = {
  getAll: (movieId) => axiosClient.get(ENDPOINTS.COMMENT.GET_ALL(movieId)),
  create: (movieId, payload) => axiosClient.post(ENDPOINTS.COMMENT.CREATE(movieId), payload),
  remove: (movieId, commentId) => axiosClient.delete(ENDPOINTS.COMMENT.DELETE(movieId, commentId)),
};