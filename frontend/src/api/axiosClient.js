import axios from 'axios';
import queryString from 'query-string';

// 1. Cấu hình chung
const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api', // Đảm bảo đúng cổng backend
    headers: {
        'content-type': 'application/json',
    },
    // Xử lý params trên URL cho đẹp (VD: ?search=abc&page=1)
    paramsSerializer: params => queryString.stringify(params),
});

// 2. Interceptor REQUEST (Can thiệp trước khi gửi đi)
// Tự động lấy token từ localStorage và gắn vào Header
axiosClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 3. Interceptor RESPONSE (Can thiệp sau khi nhận kết quả)
axiosClient.interceptors.response.use((response) => {
    // Nếu có data, trả về data luôn để code gọn hơn
    if (response && response.data) {
        return response.data;
    }
    return response;
}, (error) => {
    // Xử lý lỗi chung (Ví dụ: Log lỗi ra console)
    // Bạn có thể xử lý logout tự động tại đây nếu muốn
    if (error.response && error.response.status === 401) {
        // console.log("Hết phiên đăng nhập/Token không hợp lệ");
        // localStorage.removeItem('token');
        // window.location.href = '/login'; // Cẩn thận vòng lặp nếu dùng cái này
    }
    throw error;
});

export default axiosClient;