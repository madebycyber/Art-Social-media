import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Gửi Token kèm theo mỗi request
axiosClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. Xử lý phản hồi (Response) & Tự động Logout khi Token hết hạn
axiosClient.interceptors.response.use(
    (response) => {
        if (response && response.data) {
            return response.data;
        }
        return response;
    },
    (error) => {
        // Nếu Server trả về 401 (Unauthorized) -> Token hết hạn hoặc không hợp lệ
        if (error.response && error.response.status === 401) {
            console.warn("Token hết hạn, đang đăng xuất...");
            
            // Xóa data trong LocalStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Chuyển hướng về trang Login
            // Lưu ý: Dùng window.location để force reload lại trang sạch sẽ
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        throw error;
    }
);

export default axiosClient;