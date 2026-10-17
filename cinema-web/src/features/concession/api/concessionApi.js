import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/concessions';

export const concessionApi = {
    getMenu: async () => {
        const response = await axios.get(`${API_BASE_URL}/menu`);
        return response.data;
    },
    getManageList: async () => {
        const response = await axios.get(`${API_BASE_URL}/manage/list`);
        return response.data;
    },
    saveConcession: async (concessionData) => {
        const response = await axios.post(`${API_BASE_URL}/manage/save`, concessionData);
        return response.data;
    },
    calculateTotal: async (cartData) => {
        const response = await axios.post(`${API_BASE_URL}/calculate-total`, cartData);
        return response.data;
    }
};