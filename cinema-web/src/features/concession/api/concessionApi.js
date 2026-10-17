import axios from 'axios';

const API_BASE_URL = "http://localhost:8080/api/concessions";

// Hàm lấy và làm sạch token xác thực từ localStorage
const getAuthHeaders = () => {
    let token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
    
    // Loại bỏ dấu ngoặc kép hoặc khoảng trắng thừa nếu có
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
    getMenu: async () => {
        const response = await axios.get(`${API_BASE_URL}/menu`, getAuthHeaders());
        return response.data;
    },
    
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