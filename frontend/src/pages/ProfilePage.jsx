import React from 'react';
import Sidebar from '../components/Sidebar';

const ProfilePage = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return (
        <div className="social-layout">
            <aside><Sidebar user={user} /></aside>
            <main className="glass-panel" style={{ margin: '20px', padding: '20px', color: 'white' }}>
                <h2>Hồ sơ người dùng</h2>
                <p>Xin chào, {user?.username}!</p>
            </main>
        </div>
    );
};
export default ProfilePage;