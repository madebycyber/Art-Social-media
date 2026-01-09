import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { User, MapPin, Calendar, Heart, Image as ImageIcon, Edit3 } from 'lucide-react';
import ImagePreviewModal from '../components/ImagePreviewModal';

const ProfilePage = () => {
    // 1. Lấy user từ localStorage
    const [user] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [previewTitle, setPreviewTitle] = useState(null);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. Gọi API lấy danh sách tranh của User
    useEffect(() => {
        if (user && user.id) {
            fetchUserArtworks();
        }
    }, [user]);

    const fetchUserArtworks = async () => {
        try {
            // Gọi endpoint ta vừa tạo ở Backend
            const res = await axiosClient.get(`/artworks/user/${user.id}`);
            setArtworks(res || []);
        } catch (error) {
            console.error("Lỗi tải tranh:", error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý URL ảnh (nếu backend trả về đường dẫn tương đối)
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/300';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000${path}`; // Chỉnh port theo backend của bạn
    };

    if (!user) return <div style={{color:'white', padding: 20}}>Vui lòng đăng nhập.</div>;

    return (
        <div className="social-layout">
            <main className="no-scrollbar" style={{ overflowY: 'auto', height: 'calc(100vh - 20px)', padding: '0 20px 20px 0' }}>
                
                {/* --- HEADER PROFILE --- */}
                <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                    {/* Background trang trí mờ ảo */}
                    <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(50px)', zIndex: 0 }}></div>

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                        {/* Avatar lớn */}
                        <div style={{ 
                            width: '120px', height: '120px', borderRadius: '50%', 
                            border: '4px solid rgba(255,255,255,0.1)',
                            background: 'linear-gradient(45deg, #f09, #30f)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '48px', fontWeight: 'bold', color: 'white',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                        }}>
                            {user.username.charAt(0).toUpperCase()}
                        </div>

                        {/* Thông tin User */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '32px', margin: '0 0 5px 0', color: 'white' }}>{user.username}</h2>
                                    <span style={{ 
                                        padding: '5px 12px', borderRadius: '20px', fontSize: '12px', 
                                        background: user.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                                        color: user.role === 'ADMIN' ? '#fca5a5' : '#a5b4fc', border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        @{user.role}
                                    </span>
                                </div>
                                <button className="btn-primary" style={{ display: 'flex', gap: '8px', padding: '10px 20px' }}>
                                    <Edit3 size={18} /> Chỉnh sửa hồ sơ
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginTop: '20px', color: '#a1a1aa', fontSize: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={16} /> Việt Nam
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={16} /> Tham gia 2025
                                </div>
                            </div>

                            {/* Thống kê nhanh */}
                            <div style={{ display: 'flex', gap: '40px', marginTop: '25px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{artworks.length}</div>
                                    <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Bài viết</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>0</div>
                                    <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Đang theo dõi</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>0</div>
                                    <div style={{ fontSize: '12px', color: '#a1a1aa' }}>Người theo dõi</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- GRID HIỂN THỊ TRANH --- */}
                <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <ImageIcon size={24} color="#8b5cf6" /> Bộ sưu tập của tôi
                </h3>

                {loading ? (
                    <div style={{ color: '#aaa', textAlign: 'center', padding: '50px' }}>Đang tải tranh...</div>
                ) : artworks.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: '#aaa' }}>
                        <p>Bạn chưa đăng tác phẩm nào.</p>
                        <button className="btn-primary" style={{ marginTop: '10px' }}>Đăng ngay</button>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                        gap: '20px' 
                    }}>
                        {artworks.map((art) => (
                            <div key={art.id} className="glass-panel" style={{ 
                                padding: '10px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s',
                                position: 'relative', group: 'hover'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {/* Ảnh */}
                                <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                                    <img 
                                        src={`http://localhost:5000/api/artworks/images/${art.filePath}`} 
                                        alt={art.title} 
                                        onClick={() => { setPreviewImage(`http://localhost:5000/api/artworks/images/${art.filePath}`); setPreviewTitle(art.title); }}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }} 
                                    />
                                </div>

                                {/* Thông tin bên dưới */}
                                <div style={{ marginTop: '12px' }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {art.title}
                                    </h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#a1a1aa' }}>
                                        <span>{new Date(art.createdAt).toLocaleDateString('vi-VN')}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Heart size={14} color="#f43f5e" fill="#f43f5e" />
                                            {art.likeCount || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* --- MODAL XEM ẢNH FULL (MỚI) --- */}
                        <ImagePreviewModal 
                            isOpen={!!previewImage} 
                            imageUrl={previewImage} 
                            title={previewTitle}
                            onClose={() => setPreviewImage(null)} 
                        />
                    </div>
                    
                )}
            </main>
        </div>
    );
};

export default ProfilePage;