import axiosClient from '../../../api/axiosClient';

const API_BASE_URL = '/api/concessions';

export const concessionApi = {
  getMenu: () =>
    axiosClient.get(`${API_BASE_URL}/menu`),

  getManageList: () =>
    axiosClient.get(`${API_BASE_URL}/manage/list`),

  saveConcession: (concessionData) =>
    axiosClient.post(
      `${API_BASE_URL}/manage/save`,
      concessionData
    ),

  calculateTotal: (cartData) =>
    axiosClient.post(
      `${API_BASE_URL}/calculate-total`,
      cartData
    ),
};