import axiosClient from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

export const showtimeApi = {
  getAll: (params = {}) => axiosClient.get(ENDPOINTS.SHOWTIME.GET_ALL, { params }),
  getById: (id) => axiosClient.get(ENDPOINTS.SHOWTIME.GET_DETAIL(id)),
  getSeats: (id) => axiosClient.get(ENDPOINTS.SHOWTIME.SEATS(id)),
  create: (payload) => axiosClient.post(ENDPOINTS.SHOWTIME.CREATE, payload),
  update: (id, payload) => axiosClient.put(ENDPOINTS.SHOWTIME.UPDATE(id), payload),
  remove: (id) => axiosClient.delete(ENDPOINTS.SHOWTIME.DELETE(id)),
  updateSeatStatus: (id, payload) => axiosClient.patch(ENDPOINTS.SHOWTIME.UPDATE_SEAT_STATUS(id), payload),
};