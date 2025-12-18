import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError("Mật khẩu không khớp!");

        try {
            await axiosClient.post('/auth/register', { username, password });
            alert('Đăng ký thành công!');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data || 'Đăng ký thất bại');
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '28px' }}>Create Account</h2>
                
                {error && <div style={{ background: 'rgba(255, 0, 0, 0.2)', padding: '10px', borderRadius: '8px', color: '#ff8080', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>Username</label>
                        <input className="glass-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>Password</label>
                        <input className="glass-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#a1a1aa' }}>Confirm Password</label>
                        <input className="glass-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Đăng ký</button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#a1a1aa' }}>
                    Đã có tài khoản? <Link to="/login" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;