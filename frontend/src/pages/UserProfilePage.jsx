import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import FollowButton from '../components/FollowButton';
import ImagePreviewModal from '../components/ImagePreviewModal'; // 1. Import
import { Image as ImageIcon, MapPin, Calendar } from 'lucide-react';

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [currentUser] = useState(() => JSON.parse(localStorage.getItem('user')));
    
    const [targetUser, setTargetUser] = useState(null);
    const [artworks, setArtworks] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    
    // 2. State cho Modal
    const [previewImage, setPreviewImage] = useState(null);
    const [previewTitle, setPreviewTitle] = useState("");

    useEffect(() => {
        if (!currentUser) navigate('/login');
        if (currentUser?.id === Number(userId)) navigate('/profile');
        fetchData();
    }, [userId]);

    const fetchData = async () => {
        try {
            // API này sẽ hết lỗi 403 sau khi sửa Backend ở Phần 1
            const uInfo = await axiosClient.get(`/users/${userId}`);
            setTargetUser(uInfo);

            const followingList = await axiosClient.get('/users/me/following-ids');
            const followingSet = new Set(followingList);
            setIsFollowing(followingSet.has(Number(userId)));

            const arts = await axiosClient.get(`/artworks/user/${userId}`);
            setArtworks(arts || []);
        } catch (e) { 
            console.error("Lỗi tải profile:", e);
        }
    };

    // Logic lọc quyền xem ảnh
    const visibleArtworks = artworks.filter(art => {
        if (art.privacy === 'PUBLIC') return true;
        if (art.privacy === 'FOLLOWER' && isFollowing) return true;
        return false; 
    });

    const handleToggleFollow = async () => {
       // ... (Code follow giữ nguyên như cũ)
    };

    if (!targetUser) return <div style={{color:'white', padding:20}}>Đang tải...</div>;

    return (
        <div className="social-layout">
            <main className="no-scrollbar" style={{ overflowY: 'auto', height: 'calc(100vh - 20px)', padding: '0 20px 20px 0' }}>
                {/* Header User (Giữ nguyên code cũ) */}
                <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px', display:'flex', gap:'30px', alignItems:'flex-start' }}>
                    {/* ... Avatar, Tên, FollowButton ... */}
                     <h2 style={{color: 'white'}}>{targetUser.username}</h2>
                     {/* ... */}
                </div>

                <h3 style={{ color: 'white', marginBottom: '20px' }}><ImageIcon size={24} style={{verticalAlign:'middle'}}/> Tác phẩm ({visibleArtworks.length})</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                    {visibleArtworks.map(art => {
                        const imgUrl = `http://localhost:5000/api/artworks/images/${art.filePath}`;
                        return (
                            <div key={art.id} className="glass-panel" style={{ padding: '10px', cursor: 'zoom-in' }}>
                                <div style={{ borderRadius: '8px', overflow: 'hidden', aspectRatio: '1/1', background: '#000' }}>
                                    {/* 3. Gắn sự kiện Click vào ảnh */}
                                    <img 
                                        src={imgUrl} 
                                        alt={art.title} 
                                        onClick={() => { setPreviewImage(imgUrl); setPreviewTitle(art.title); }}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* 4. Đặt Modal ở cuối */}
                <ImagePreviewModal 
                    isOpen={!!previewImage} 
                    imageUrl={previewImage} 
                    title={previewTitle} 
                    onClose={() => setPreviewImage(null)} 
                />
            </main>
        </div>
    );
};
export default UserProfilePage;