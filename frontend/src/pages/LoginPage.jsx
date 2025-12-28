// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';

// 1. Nhận prop onLoginSuccess từ App.js truyền vào
const LoginPage = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Reset error trước khi gọi API mới

        try {
            // Gọi API Login
            const res = await axiosClient.post('/auth/login', { username, password });
            
            // Kiểm tra kết quả trả về
            if (res && res.token) {
                // A. Lưu Token vào LocalStorage
                localStorage.setItem('token', res.token);
                
                // B. Lưu thông tin User vào LocalStorage
                // Backend trả về: { token, username, role, id }
                // Ta lưu toàn bộ hoặc lọc ra user info
                const userData = {
                    username: res.username,
                    role: res.role,
                    id: res.id
                };
                localStorage.setItem('user', JSON.stringify(userData));

                // C. QUAN TRỌNG: Gọi hàm callback để báo cho App.js cập nhật State ngay lập tức
                // Điều này giúp Sidebar hiển thị đúng menu Admin/Logout mà không cần F5
                if (onLoginSuccess) {
                    onLoginSuccess(); 
                }

                // D. Điều hướng về trang chủ
                navigate('/', { replace: true });
            } else {
                setError('Phản hồi từ server không hợp lệ');
            }
        } catch (err) {
            console.error(err);
            // Lấy message lỗi từ backend nếu có (ví dụ: "Sai mật khẩu")
            const msg = err.response?.data || 'Sai tên đăng nhập hoặc mật khẩu';
            setError(msg);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '28px' }}>Welcome Back</h2>
                
                {error && (
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.2)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '10px', 
                        borderRadius: '8px', 
                        color: '#fca5a5', 
                        marginBottom: '20px', 
                        textAlign: 'center',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>Username</label>
                        <input 
                            className="glass-input" 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="Nhập tên đăng nhập..."
                        />
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>Password</label>
                        <input 
                            className="glass-input" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="Nhập mật khẩu..."
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Đăng nhập</button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#a1a1aa' }}>
                    Chưa có tài khoản? <Link to="/register" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;