import React from 'react';
import { Home, PlusSquare, User, LogOut, Heart } from 'lucide-react'; // Bỏ Settings nếu chưa dùng
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();
  
  const menuItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: PlusSquare, label: 'Đăng tranh', path: '/upload' },
    { icon: Heart, label: 'Yêu thích', path: '/favorites' },
    { icon: User, label: 'Hồ sơ', path: '/profile' },
  ];

  // Logic kiểm tra Active chuẩn hơn:
  // Nếu path là '/' thì phải trùng khớp hoàn toàn.
  // Nếu path khác (vd /profile) thì chỉ cần URL bắt đầu bằng /profile (hỗ trợ /profile/edit)
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      {/* Logo */}
      <div style={{ marginBottom: '40px', paddingLeft: '10px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ArtSocial
        </h1>
      </div>

      {/* Menu */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => (
          <Link to={item.path} key={item.path} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px',
              // Sửa logic Active Style
              background: isActive(item.path) ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: isActive(item.path) ? '#fff' : '#a1a1aa',
              fontWeight: isActive(item.path) ? '600' : '400',
              border: isActive(item.path) ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid transparent',
              cursor: 'pointer', transition: '0.2s'
            }}>
              <item.icon size={20} color={isActive(item.path) ? '#8b5cf6' : 'currentColor'} />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* User Footer */}
      {user && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09, #30f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'white' }}>{user.username}</div>
              <div style={{ fontSize: '12px', color: '#a1a1aa' }}>@{user.role}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: '100%', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '10px', borderRadius: '10px', color: '#ff4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;