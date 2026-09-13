import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor để thêm token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor để xử lý refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Nếu lỗi 401 và chưa thử refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }
                
                // Gọi API refresh token
                const response = await axios.post('http://localhost:5000/api/auth/refresh-token', {
                    refresh_token: refreshToken
                });
                
                const { access_token } = response.data;
                
                // Lưu token mới
                localStorage.setItem('access_token', access_token);
                
                // Cập nhật header và gọi lại request cũ
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
                
            } catch (refreshError) {
                // Nếu refresh thất bại, xóa token và buộc đăng nhập lại
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/admin/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
