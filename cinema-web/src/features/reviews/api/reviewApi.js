import axiosClient from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

export const reviewApi = {
  getAll: () => axiosClient.get(ENDPOINTS.REVIEW.GET_ALL),
  getByMovie: (movieId) => axiosClient.get(ENDPOINTS.REVIEW.GET_BY_MOVIE(movieId)),
  getById: (id) => axiosClient.get(ENDPOINTS.REVIEW.GET_DETAIL(id)),
  create: (payload) => axiosClient.post(ENDPOINTS.REVIEW.CREATE, payload),
  update: (id, payload) => axiosClient.put(ENDPOINTS.REVIEW.UPDATE(id), payload),
  remove: (id) => axiosClient.delete(ENDPOINTS.REVIEW.DELETE(id)),
};
