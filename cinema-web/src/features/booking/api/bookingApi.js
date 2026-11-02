import axiosClient from '../../../api/axiosClient';

export const bookingApi = {
  create: (payload) =>
    axiosClient.post('/api/v1/bookings', payload),

  updateServices: (id, payload) =>
    axiosClient.put(`/api/v1/bookings/${id}/services`, payload),

  getById: (id) =>
    axiosClient.get(`/api/v1/bookings/${id}`),

  getMine: () =>
    axiosClient.get('/api/v1/bookings/me'),

  cancel: (id) =>
    axiosClient.post(`/api/v1/bookings/${id}/cancel`),

  paymentUrl: (id) =>
    axiosClient.post(`/api/v1/payments/vnpay/${id}/url`),

  verifyPayment: (id) =>
    axiosClient.post(`/api/v1/payments/vnpay/${id}/verify`),
};