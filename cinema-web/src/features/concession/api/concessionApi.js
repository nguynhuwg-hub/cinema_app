import axios from 'axios';

const API_BASE_URL = "http://localhost:8080/api/concessions";

const getAuthHeaders = () => {
    let token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    if (token) {
        token = token.replace(/^"(.*)"\$/, '\$1').trim();
    }
    return {
        headers: {
            Authorization: token ? `Bearer ${token}` : ''
        }
    };
};

export const concessionApi = {
    // Khách hàng xem menu (Public API, không bắt buộc truyền token)
    getMenu: async () => {
        const response = await axios.get(`${API_BASE_URL}/menu`);
        return response.data;
    },
    
    // Dành cho Admin quản lý (Yêu cầu quyền Admin/Staff)
    getManageList: async () => {
        const response = await axios.get(`${API_BASE_URL}/manage/list`, getAuthHeaders());
        return response.data;
    },
    
    saveConcession: async (concessionData) => {
        const response = await axios.post(`${API_BASE_URL}/manage/save`, concessionData, getAuthHeaders());
        return response.data;
    },
    
    calculateTotal: async (cartData) => {
        const response = await axios.post(`${API_BASE_URL}/calculate-total`, cartData, getAuthHeaders());
        return response.data;
    }
};