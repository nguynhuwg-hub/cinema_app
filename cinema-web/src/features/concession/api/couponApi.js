import axios from 'axios';

const API_BASE_URL = "http://localhost:8080/api/coupons";

// Hàm lấy token xác thực từ localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    return {
        headers: {
            Authorization: token ? `Bearer ${token}` : ''
        }
    };
};

export const couponApi = {
    getManageList: async () => {
        const response = await axios.get(`${API_BASE_URL}/manage/list`, getAuthHeaders());
        return response.data;
    },
    
    saveCoupon: async (couponData) => {
        const response = await axios.post(`${API_BASE_URL}/manage/save`, couponData, getAuthHeaders());
        return response.data;
    },
    
    validateCoupon: async (code, totalAmount) => {
        const response = await axios.post(`${API_BASE_URL}/validate`, null, {
            ...getAuthHeaders(),
            params: { code, totalAmount }
        });
        return response.data;
    }
};