// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CommentItem from '../components/CommentItem';
import FollowButton from '../components/FollowButton'; // Import component mới
import { MessageCircle, Heart, Share2, Search, Bookmark, X, Plus } from 'lucide-react';

const Home = () => {
    const [artworks, setArtworks] = useState([]);
    const [likedIds, setLikedIds] = useState(new Set()); // Lưu các ID đã like
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });
    const [expandedPostId, setExpandedPostId] = useState(null); // ID bài viết đang xem comment
    const [comments, setComments] = useState([]); // List comment của bài đang xem

    // State cho Modal "Lưu vào bộ sưu tập"
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [selectedArtworkId, setSelectedArtworkId] = useState(null);
    const [myCollections, setMyCollections] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set()); // Set ID để check nhanh
    const [myFollowingList, setMyFollowingList] = useState([]);  // List hiển thị Sidebar
    const [myFollowersList, setMyFollowersList] = useState([]);  // List hiển thị Sidebar

    const navigate = useNavigate();

    // 2. Logic kiểm tra đăng nhập (Chuyển vào LayoutEffect hoặc Effect đầu tiên)
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // 3. Logic Fetch Data (Tách biệt hoàn toàn)
    useEffect(() => {
        // Chỉ chạy khi user tồn tại
        if (user) {
            const fetchData = async () => {
                try {
                    const artworksData = await axiosClient.get('/artworks');
                    if (Array.isArray(artworksData)) setArtworks(artworksData);

                    const likedData = await axiosClient.get('/users/me/liked-ids');
                    if (Array.isArray(likedData)) setLikedIds(new Set(likedData));

                    const followingIdData = await axiosClient.get('/users/me/following-ids');
                    if (Array.isArray(followingIdData)) setFollowingIds(followingData);
                    const followingData = await axiosClient.get('/users/me/following');
                    if (Array.isArray(followingData)) setMyFollowingList(followingData);
                    const followerData = axiosClient.get('/users/me/followers');
                    if (Array.isArray(followerData)) setMyFollowersList(followerData);
                } catch (error) {
                    console.error("Error fetching home data:", error);
                    // Nếu lỗi 401 (Unauthorized), lúc này mới đá về login
                    if (error.response && error.response.status === 401) {
                         localStorage.clear();
                         navigate('/login');
                    }
                }
            };
            fetchData();
        }
    }, [user]); // Phụ thuộc vào user để chạy lại khi login xong
    // Xử lý Like/Unlike
    const handleToggleLike = async (artworkId) => {
        const isLiked = likedIds.has(artworkId);
        
        // 1. Cập nhật UI ngay lập tức (Optimistic update)
        setLikedIds(prev => {
            const newSet = new Set(prev);
            if (isLiked) newSet.delete(artworkId);
            else newSet.add(artworkId);
            return newSet;
        });

        setArtworks(prev => prev.map(art => {
            if (art.id === artworkId) {
                return { ...art, likeCount: isLiked ? art.likeCount - 1 : art.likeCount + 1 };
            }
            return art;
        }));

        // 2. Gọi API ngầm
        try {
            if (isLiked) {
                await axiosClient.delete(`/artworks/${artworkId}/like`);
            } else {
                await axiosClient.post(`/artworks/${artworkId}/like`);
            }
        } catch (error) {
            console.error("Lỗi like:", error);
            // Revert lại nếu lỗi (Optional)
        }
    };

    // Hàm load comment khi bấm nút "Bình luận"
    const handleToggleComments = async (artworkId) => {
        if (expandedPostId === artworkId) {
            setExpandedPostId(null); // Đóng lại nếu đang mở
        } else {
            setExpandedPostId(artworkId);
            // Gọi API lấy comment
            const data = await axiosClient.get(`/comments/artwork/${artworkId}`);
            setComments(data || []);
        }
    };

    // Hàm gửi comment mới
    const handleSubmitComment = async (artworkId, content, parentId = null) => {
        try {
            // SỬA: Gửi JSON Object thay vì FormData
            const payload = {
                artworkId: artworkId,
                content: content,
                parentId: parentId
            };

            await axiosClient.post('/comments', payload);
            
            // Reload lại comment sau khi đăng thành công
            const data = await axiosClient.get(`/comments/artwork/${artworkId}`);
            setComments(data || []);
        } catch (error) {
            console.error("Lỗi đăng comment:", error);
            alert("Không thể đăng bình luận. Vui lòng thử lại hoặc đăng nhập lại.");
        }
    };

    // --- LOGIC FOLLOW XỬ LÝ TẠI ĐÂY ---
    const handleToggleFollow = async (targetUserId) => {
        const isFollowing = followingIds.has(targetUserId);

        // 1. CẬP NHẬT UI NGAY LẬP TỨC (Optimistic UI)
        
        // A. Cập nhật Set ID (để nút bấm đổi màu ngay)
        setFollowingIds(prev => {
            const newSet = new Set(prev);
            if (isFollowing) newSet.delete(targetUserId);
            else newSet.add(targetUserId);
            return newSet;
        });

        // B. Cập nhật danh sách Sidebar (Thêm/Xóa user khỏi list)
        if (isFollowing) {
            // Nếu đang follow -> Unfollow -> Xóa khỏi list Following
            setMyFollowingList(prev => prev.filter(u => u.id !== targetUserId));
        } else {
            // Nếu chưa follow -> Follow -> Thêm vào list Following
            // Cần tìm info user này trong artworks hoặc followers list để thêm vào
            // Cách đơn giản nhất: Tìm trong artworks đang hiển thị
            const targetUser = artworks.find(a => a.user.id === targetUserId)?.user 
                            || myFollowersList.find(u => u.id === targetUserId);
            
            if (targetUser) {
                setMyFollowingList(prev => [...prev, targetUser]);
            } else {
                // Nếu không tìm thấy thông tin cục bộ, reload lại list sau khi API xong
                // (Trường hợp hiếm)
            }
        }

        // 2. GỌI API NGẦM
        try {
            if (isFollowing) {
                await axiosClient.delete(`/users/${targetUserId}/follow`);
            } else {
                await axiosClient.post(`/users/${targetUserId}/follow`);
            }
            // Để chắc chắn đồng bộ, có thể gọi lại API lấy list sidebar tại đây nếu muốn
        } catch (error) {
            console.error("Lỗi follow:", error);
            // Revert lại UI nếu lỗi (Optional)
        }
    };

    // --- LOGIC ĐĂNG XUẤT ---
    const handleLogout = () => {
        localStorage.clear(); // Xóa sạch mọi thứ (Token, User)
        setUser(null);
        navigate('/login');
    };

    // --- LOGIC SAVE COLLECTION ---
    const handleOpenSaveModal = async (artworkId) => {
        setSelectedArtworkId(artworkId);
        setShowCollectionModal(true);
        // Load danh sách collection của user để chọn
        const cols = await axiosClient.get('/users/me/collections');
        setMyCollections(cols || []);
    };

    const handleAddToCollection = async (collectionId) => {
        try {
            await axiosClient.post(`/users/me/collections/${collectionId}/add/${selectedArtworkId}`);
            alert("Đã lưu vào bộ sưu tập!");
            setShowCollectionModal(false);
        } catch (error) {
            alert("Lỗi: " + (error.response?.data || "Không thể lưu"));
        }
    };

    if (!user) return null;

    return (
        <div className="social-layout">
            <aside style={{ height: 'calc(100vh - 48px)' }}>
                {/* Truyền hàm logout chuẩn vào Sidebar */}
                <Sidebar user={user} onLogout={handleLogout} />
            </aside>

            <main className="no-scrollbar" style={{ overflowY: 'auto', height: 'calc(100vh - 48px)', paddingRight: '10px' }}>
                {/* Search Bar giữ nguyên */}
                <div className="glass-panel" style={{ padding: '15px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky', top: 0, zIndex: 10 }}>
                    <Search size={20} color="#a1a1aa" />
                    <input type="text" placeholder="Tìm kiếm tranh, nghệ sĩ..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '16px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {artworks.map(art => {
                        const isLiked = likedIds.has(art.id);
                        return (
                            <div key={art.id} className="glass-panel" style={{ padding: '20px', borderRadius: '24px' }}>
                                {/* Header (Avatar)*/}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                                            {art.user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                        <h4 style={{ margin: 0 }}>{art.title}</h4>
                                        <span style={{ fontSize: '12px', color: '#a1a1aa' }}>@{art.user?.username}</span>
                                        </div>
                                    </div>
                                
                                {/* NÚT FOLLOW */}
                                <FollowButton 
                                    targetUserId={art.user.id}
                                    myId={user.id}
                                    isFollowing={followingIds.has(art.user.id)}
                                    onToggle={handleToggleFollow}
                                />
                                </div>

                                {/* Ảnh */}
                                <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                                    <img 
                                        src={`http://localhost:5000/api/artworks/images/${art.filePath}`} 
                                        alt={art.title} 
                                        style={{ width: '100%', display: 'block', minHeight: '200px', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; }} 
                                    />
                                </div>

                                {/* Caption */}
                                <p style={{ color: '#d4d4d8', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>{art.caption}</p>

                                {/* Action Buttons - ĐÃ SỬA */}
                                <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                                    
                                    {/* Nút LIKE */}
                                    <button 
                                        onClick={() => handleToggleLike(art.id)}
                                        style={{ background: 'transparent', border: 'none', color: isLiked ? '#ef4444' : '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: '0.2s' }}
                                    >
                                        <Heart size={20} fill={isLiked ? "#ef4444" : "none"} /> 
                                        {art.likeCount || 0}
                                    </button>

                                    <button 
                                        onClick={() => handleToggleComments(art.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                    >
                                        <MessageCircle size={20} /> Bình luận
                                    </button>
                                
                                    <button style={{ background: 'transparent', border: 'none', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <Share2 size={20} /> Chia sẻ
                                    </button>

                                    {/* Nút SAVE */}
                                    <button onClick={() => handleOpenSaveModal(art.id)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                                        <Bookmark size={20} />
                                    </button>

                                </div>
                                <div style={{gap: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                                                                        {expandedPostId === art.id && (
                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '15px', paddingTop: '15px' }}>
                                            
                                            {/* Form nhập comment gốc */}
                                            <form 
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    handleSubmitComment(art.id, e.target.rootComment.value);
                                                    e.target.rootComment.value = '';
                                                }} 
                                                style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}
                                            >
                                                <input 
                                                    name="rootComment"
                                                    type="text" 
                                                    className="glass-input" 
                                                    placeholder="Viết bình luận của bạn..." 
                                                    autoComplete="off"
                                                />
                                                <button type="submit" className="btn-primary">Gửi</button>
                                            </form>

                                            {/* Danh sách Comment */}
                                            <div>
                                                {/* Lọc ra các comment gốc (không có parent) để render trước */}
                                                {comments.filter(c => !c.parent).map(c => (
                                                    <CommentItem 
                                                        key={c.id} 
                                                        comment={c} 
                                                        allComments={comments} // Truyền toàn bộ list để component con tự tìm children
                                                        onReplySubmit={(parentId, text) => handleSubmitComment(art.id, text, parentId)}
                                                    />
                                                ))}
                                                
                                                {comments.length === 0 && <p style={{color: '#666', fontSize: '13px', textAlign: 'center'}}>Chưa có bình luận nào.</p>}
                                            </div>
                                        </div>
                                    )}
                                    {showCollectionModal && (
                                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                                            <div className="glass-panel" style={{ width: '300px', padding: '20px', background: '#18181b', border: '1px solid #333' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                                    <h3 style={{ margin: 0, color: 'white' }}>Lưu vào...</h3>
                                                    <button onClick={() => setShowCollectionModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
                                                </div>
                                                
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {myCollections.length > 0 ? myCollections.map(col => (
                                                        <button 
                                                            key={col.id} 
                                                            onClick={() => handleAddToCollection(col.id)}
                                                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#d4d4d8', cursor: 'pointer', textAlign: 'left' }}
                                                        >
                                                            {col.name}
                                                        </button>
                                                    )) : (
                                                        <div style={{color: '#666', fontSize: '13px'}}>Bạn chưa có bộ sưu tập nào.</div>
                                                    )}
                                                    
                                                    {/* Link tạo nhanh collection nếu cần (Chuyển hướng) */}
                                                    <button onClick={() => {setShowCollectionModal(false); navigate('/favorites');}} style={{ marginTop: '10px', color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <Plus size={16}/> Tạo bộ sưu tập mới
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
             {/* SIDEBAR PHẢI */}
            <aside style={{ height: 'calc(100vh - 48px)' }}>
                <div className="glass-panel" style={{ padding: '20px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
                    
                    {/* LIST 1: ĐANG THEO DÕI */}
                    <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#a78bfa' }}>Đang theo dõi ({myFollowingList.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                        {myFollowingList.map(u => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{u.username}</div>
                                </div>
                                <FollowButton 
                                    targetUserId={u.id}
                                    myId={user.id}
                                    isFollowing={true} // List này chắc chắn là true
                                    onToggle={handleToggleFollow}
                                />
                            </div>
                        ))}
                    </div>

                    <hr style={{borderColor: 'rgba(255,255,255,0.1)'}} />

                    {/* LIST 2: NGƯỜI THEO DÕI TÔI */}
                    <h4 style={{ marginTop: '20px', marginBottom: '15px', color: '#f472b6' }}>Người theo dõi ({myFollowersList.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {myFollowersList.map(u => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>{u.username}</div>
                                </div>
                                <FollowButton 
                                    targetUserId={u.id}
                                    myId={user.id}
                                    isFollowing={followingIds.has(u.id)}
                                    onToggle={handleToggleFollow}
                                />
                            </div>
                        ))}
                    </div>

                </div>
            </aside>
        </div>
    );
};
export default Home;