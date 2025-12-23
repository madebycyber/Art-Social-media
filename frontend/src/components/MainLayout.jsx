import React from 'react';
import Sidebar from './Sidebar'; // Sidebar Trái
import RightSidebar from './RightSidebar'; // Sidebar Phải mới tạo
import { useLocation } from 'react-router-dom';

const MainLayout = ({ children, user, onLogout }) => {
    const location = useLocation();
    
    // Các trang KHÔNG hiện Sidebar (Login, Register)
    const noLayoutRoutes = ['/login', '/register'];
    
    // Logic: Nếu muốn trang Chat KHÔNG hiện cột phải (để rộng chỗ chat) thì thêm vào đây
    // const hideRightSidebarRoutes = ['/chat']; 
    // const showRightSidebar = !hideRightSidebarRoutes.includes(location.pathname);
    const showRightSidebar = true; // Hiện tại cho hiện ở tất cả các trang

    if (noLayoutRoutes.includes(location.pathname)) {
        return <div style={{ width: '100vw', height: '100vh' }}>{children}</div>;
    }

    return (
        <div className="app-layout-3-cols">
            
            {/* 1. CỘT TRÁI (MENU) */}
            <aside className="layout-left-sidebar">
                <Sidebar user={user} onLogout={onLogout} />
            </aside>

            {/* 2. CỘT GIỮA (NỘI DUNG CHÍNH) */}
            <main className="layout-main-content">
                <div className="layout-content-inner">
                    {children}
                </div>
            </main>

            {/* 3. CỘT PHẢI (DANH SÁCH BẠN BÈ) */}
            {showRightSidebar && (
                <aside className="layout-right-sidebar">
                    <RightSidebar user={user} />
                </aside>
            )}
            
        </div>
    );
};

export default MainLayout;