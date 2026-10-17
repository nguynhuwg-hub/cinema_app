import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/coupons';

export const couponApi = {
    getManageList: async () => {
        const response = await axios.get(`${API_BASE_URL}/manage/list`);
        return response.data;
    },
    saveCoupon: async (couponData) => {
        const response = await axios.post(`${API_BASE_URL}/manage/save`, couponData);
        return response.data;
    },
    validateCoupon: async (code, totalAmount) => {
        const response = await axios.post(`${API_BASE_URL}/validate`, null, {
            params: { code, totalAmount }
        });
        return response.data;
    }
};