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
import RoleManagementPage from './pages/RoleManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import UserProfilePage from './pages/UserProfilePage';

function App() {
    // Khởi tạo state từ localStorage
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    // --- HÀM NÀY ĐỂ LOGIN PAGE GỌI ---
    const handleLoginSuccess = () => {
        // Đọc lại từ localStorage và cập nhật State -> Sidebar sẽ tự render lại
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
        setUser(JSON.parse(savedUser));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login'; // Force reload cho sạch state
    };

    return (
        <BrowserRouter>
            {/* Truyền user hiện tại vào MainLayout (chứa Sidebar) */}
            <MainLayout user={user} onLogout={handleLogout}> 
                <Routes>
                    {/* Truyền hàm handleLoginSuccess xuống LoginPage */}
                    <Route 
                        path="/login" 
                        element={<LoginPage onLoginSuccess={handleLoginSuccess} />} 
                    />
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/admin/roles" element={<RoleManagementPage />} />
                    <Route path="/admin/users" element={<UserManagementPage />} />
                    <Route path="/profile/:userId" element={<UserProfilePage />} />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    );
}

export default App;