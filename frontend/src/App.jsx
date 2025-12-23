import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Home from './pages/Home';
import UploadPage from './pages/UploadPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import ChatPage from './pages/ChatPage';
import MainLayout from './components/MainLayout'; // Import Layout vừa tạo

function App() {
    // Giả lập lấy user từ localStorage (Logic cũ của bạn)
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });

    const handleLogout = () => {
        localStorage.clear();
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <BrowserRouter>
            <MainLayout user={user} onLogout={handleLogout}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/chat" element={<ChatPage />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
}

export default App;