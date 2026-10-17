import axiosClient from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';

export const cinemaApi = {
  getAll: () => axiosClient.get(ENDPOINTS.CINEMA.GET_ALL),
  getById: (id) => axiosClient.get(ENDPOINTS.CINEMA.GET_DETAIL(id)),
  getByCity: (cityId) => axiosClient.get(ENDPOINTS.CINEMA.BY_CITY(cityId)),
  create: (payload) => axiosClient.post(ENDPOINTS.CINEMA.CREATE, payload),
  update: (id, payload) => axiosClient.put(ENDPOINTS.CINEMA.UPDATE(id), payload),
  remove: (id) => axiosClient.delete(ENDPOINTS.CINEMA.DELETE(id)),
};

export const cityApi = {
  getAll: () => axiosClient.get(ENDPOINTS.CITY.GET_ALL),
  getById: (id) => axiosClient.get(ENDPOINTS.CITY.GET_DETAIL(id)),
  create: (payload) => axiosClient.post(ENDPOINTS.CITY.CREATE, payload),
  update: (id, payload) => axiosClient.put(ENDPOINTS.CITY.UPDATE(id), payload),
  remove: (id) => axiosClient.delete(ENDPOINTS.CITY.DELETE(id)),
};

export const hallApi = {
  getAll: () => axiosClient.get(ENDPOINTS.HALL.GET_ALL),
  getById: (id) => axiosClient.get(ENDPOINTS.HALL.GET_DETAIL(id)),
  getByCinema: (cinemaId) => axiosClient.get(ENDPOINTS.HALL.BY_CINEMA(cinemaId)),
  create: (payload) => axiosClient.post(ENDPOINTS.HALL.CREATE, payload),
  remove: (id) => axiosClient.delete(ENDPOINTS.HALL.DELETE(id)),
};

export const seatApi = {
  getByHall: (hallId) => axiosClient.get(ENDPOINTS.SEAT.BY_HALL(hallId)),
  updateType: (id, payload) => axiosClient.put(ENDPOINTS.SEAT.UPDATE_TYPE(id), payload),
};