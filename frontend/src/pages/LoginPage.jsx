// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // 1. Gọi API Login
            // Lưu ý: axiosClient đã có interceptor trả về res.data, nên ở đây 'res' chính là data
            const res = await axiosClient.post('/auth/login', { username, password });
            
            // 2. Kiểm tra dữ liệu trả về
            if (res && res.token) {
                // Lưu Token
                localStorage.setItem('token', res.token);
                
                // Lưu User info (Loại bỏ token khỏi object user để cho gọn nếu muốn, hoặc lưu cả)
                // Giả sử res trả về: { token: "...", username: "...", id: 1, ... }
                localStorage.setItem('user', JSON.stringify(res));

                // 3. Điều hướng
                // Dùng { replace: true } để người dùng không bấm Back quay lại trang login được
                navigate('/', { replace: true });
            } else {
                setError('Phản hồi từ server không hợp lệ');
            }
        } catch (err) {
            console.error(err);
            setError('Sai tên đăng nhập hoặc mật khẩu');
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '28px' }}>Welcome Back</h2>
                
                {error && <div style={{ background: 'rgba(255, 0, 0, 0.2)', padding: '10px', borderRadius: '8px', color: '#ff8080', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>Username</label>
                        <input className="glass-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>Password</label>
                        <input className="glass-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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