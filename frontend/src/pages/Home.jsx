import React, { useEffect, useState, useMemo } from 'react'; // Import useMemo
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import CommentItem from '../components/CommentItem';
import FollowButton from '../components/FollowButton';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Heart, Share2, Search, Bookmark, X, Plus, Filter } from 'lucide-react';

const Home = () => {
    const [artworks, setArtworks] = useState([]);
    const [likedIds, setLikedIds] = useState(new Set());
    const [user] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });
    
    // --- STATE CHO TÌM KIẾM & BỘ LỌC ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("newest"); // Mặc định: Mới nhất

    const [expandedPostId, setExpandedPostId] = useState(null);
    const [comments, setComments] = useState([]);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [selectedArtworkId, setSelectedArtworkId] = useState(null);
    const [myCollections, setMyCollections] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set());
    
    // Lưu ý: Sidebar List được xử lý bên LayoutMain/RightSidebar rồi nên ở đây không cần state hiển thị list đó nữa 
    // (nhưng vẫn cần logic follow để update trạng thái nút bấm)
    
    const navigate = useNavigate();
    const location = useLocation();

    // Check login
    useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

    // Fetch Data
    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    const [artworksData, likedData, followingIdData] = await Promise.all([
                        axiosClient.get('/artworks'),
                        axiosClient.get('/users/me/liked-ids'),
                        axiosClient.get('/users/me/following-ids'),
                    ]);

                    if (Array.isArray(artworksData)) setArtworks(artworksData);
                    if (Array.isArray(likedData)) setLikedIds(new Set(likedData));
                    if (Array.isArray(followingIdData)) setFollowingIds(new Set(followingIdData));
                } catch (error) {
                    if (error.response && error.response.status === 401) {
                        localStorage.clear();
                        navigate('/login');
                    }
                }
            };
            fetchData();
        }
    }, [user]);

    // --- LOGIC CUỘN TỰ ĐỘNG ---
    useEffect(() => {
        // Kiểm tra xem có yêu cầu cuộn không và danh sách tranh đã load xong chưa
        if (location.state?.scrollToId && artworks.length > 0) {
            const elementId = `post-${location.state.scrollToId}`;
            const element = document.getElementById(elementId);
            
            if (element) {
                // Cuộn mượt tới phần tử đó
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Hiệu ứng nháy sáng để user biết đang xem bài nào
                element.style.transition = '0.5s';
                element.style.border = '2px solid #8b5cf6'; // Viền tím
                setTimeout(() => {
                    element.style.border = 'none'; // Tắt viền sau 2s
                }, 2000);
            }
        }
    }, [location.state, artworks]); // Chạy lại khi artworks load xong hoặc state đổi

    // --- LOGIC XỬ LÝ TÌM KIẾM VÀ SẮP XẾP (CLIENT-SIDE) ---
    const processedArtworks = useMemo(() => {
        // 1. LỌC (SEARCH)
        let result = artworks.filter(art => {
            const searchLower = searchTerm.toLowerCase();
            const matchTitle = art.title?.toLowerCase().includes(searchLower);
            const matchUser = art.user?.username?.toLowerCase().includes(searchLower);
            return matchTitle || matchUser;
        });

        // 2. SẮP XẾP (SORT)
        result.sort((a, b) => {
            switch (filterType) {
                case "newest": // Ngày đăng: Mới -> Cũ
                    return new Date(b.createdAt) - new Date(a.createdAt);
                
                case "oldest": // Ngày đăng: Cũ -> Mới
                    return new Date(a.createdAt) - new Date(b.createdAt);
                
                case "most_likes": // Số lượng Like: Cao -> Thấp
                    return (b.likeCount || 0) - (a.likeCount || 0);
                
                // Lưu ý: Comment count hiện chưa có trong API list artwork, tạm thời bỏ qua hoặc xếp theo like
                
                case "user_new": // User mới nhất (Dựa vào ID user lớn hơn là mới hơn)
                    return (b.user?.id || 0) - (a.user?.id || 0);

                case "user_old": // User cũ nhất (ID nhỏ)
                    return (a.user?.id || 0) - (b.user?.id || 0);

                // case "user_popular": 
                // Có thể cần backend hỗ trợ followerCount, tạm thời dùng likeCount làm tiêu chí phụ
                
                default: 
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return result;
    }, [artworks, searchTerm, filterType]);


    // --- CÁC HÀM XỬ LÝ (LIKE, COMMENT, FOLLOW...) GIỮ NGUYÊN ---
    const handleToggleLike = async (artworkId) => {
        const isLiked = likedIds.has(artworkId);
        setLikedIds(prev => {
            const newSet = new Set(prev);
            isLiked ? newSet.delete(artworkId) : newSet.add(artworkId);
            return newSet;
        });
        setArtworks(prev => prev.map(art => 
            art.id === artworkId ? { ...art, likeCount: isLiked ? art.likeCount - 1 : art.likeCount + 1 } : art
        ));
        try {
            isLiked ? await axiosClient.delete(`/artworks/${artworkId}/like`) 
                    : await axiosClient.post(`/artworks/${artworkId}/like`);
        } catch (e) { console.error(e); }
    };

    const handleToggleComments = async (artworkId) => {
        if (expandedPostId === artworkId) {
            setExpandedPostId(null);
        } else {
            setExpandedPostId(artworkId);
            const data = await axiosClient.get(`/comments/artwork/${artworkId}`);
            setComments(data || []);
        }
    };

    const handleSubmitComment = async (artworkId, content, parentId = null) => {
        try {
            await axiosClient.post('/comments', { artworkId, content, parentId });
            const data = await axiosClient.get(`/comments/artwork/${artworkId}`);
            setComments(data || []);
        } catch (e) { alert("Lỗi đăng bình luận"); }
    };

    const handleToggleFollow = async (targetUserId) => {
        const isFollowing = followingIds.has(targetUserId);
        setFollowingIds(prev => {
            const newSet = new Set(prev);
            isFollowing ? newSet.delete(targetUserId) : newSet.add(targetUserId);
            return newSet;
        });
        try {
            isFollowing ? await axiosClient.delete(`/users/${targetUserId}/follow`) 
                        : await axiosClient.post(`/users/${targetUserId}/follow`);
        } catch (e) { console.error(e); }
    };

    const handleOpenSaveModal = async (artworkId) => {
        setSelectedArtworkId(artworkId);
        setShowCollectionModal(true);
        const cols = await axiosClient.get('/users/me/collections');
        setMyCollections(cols || []);
    };

    const handleAddToCollection = async (collectionId) => {
        try {
            await axiosClient.post(`/users/me/collections/${collectionId}/add/${selectedArtworkId}`);
            alert("Đã lưu!"); setShowCollectionModal(false);
        } catch (e) { alert("Lỗi lưu tranh"); }
    };

    if (!user) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>

            {/* --- THANH TÌM KIẾM & BỘ LỌC (STICKY HEADER) --- */}
            <div className="glass-panel" 
                 style={{ 
                     padding: '15px', 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '15px', 
                     position: 'sticky', 
                     top: 0, 
                     zIndex: 10,
                     flexWrap: 'wrap' // Để responsive tốt hơn
                 }}
            >
                {/* Input tìm kiếm */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '8px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Search size={20} color="#a1a1aa" />
                    <input 
                        type="text" 
                        placeholder="Tìm tranh hoặc tên nghệ sĩ..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '15px' }} 
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} style={{background:'none', border:'none', color:'#a1a1aa', cursor:'pointer', display:'flex'}}>
                            <X size={16}/>
                        </button>
                    )}
                </div>

                {/* Combobox Lọc */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#a1a1aa', fontSize:'14px'}}>
                        <Filter size={16} /> <span className="desktop-only">Lọc theo:</span>
                    </div>
                    <select 
                        className="glass-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="most_likes">Nhiều Like nhất</option>
                        <option value="user_new">User Mới</option>
                        <option value="user_old">User Cũ</option>
                    </select>
                </div>
            </div>

            {/* --- DANH SÁCH TRANH (RENDER PROCESSED ARTWORKS) --- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Thông báo nếu không tìm thấy */}
                {processedArtworks.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                        <Search size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                        <p>Không tìm thấy kết quả nào phù hợp.</p>
                    </div>
                )}

                {processedArtworks.map(art => {
                    const isLiked = likedIds.has(art.id);
                    return (
                        <div key={art.id} className="glass-panel" id={`post-${art.id}`} style={{ padding: '20px', borderRadius: '24px' }}>
                            {/* HEADER POST */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize:'16px' }}>
                                        {art.user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '15px' }}>{art.title}</h4>
                                        <span style={{ fontSize: '12px', color: '#a1a1aa' }}>@{art.user?.username}</span>
                                    </div>
                                    
                                    {/* Nút Chat (Ẩn nếu là chính mình) */}
                                    {art.user.id !== user.id && (
                                        <button 
                                            onClick={() => navigate('/chat', { state: { selectedUser: art.user } })}
                                            style={{ background: 'transparent', border: '1px solid #52525b', color: '#d4d4d8', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '5px' }}
                                        >
                                            <MessageCircle size={12} /> Chat
                                        </button>
                                    )}
                                </div>
                                <FollowButton 
                                    targetUserId={art.user.id} myId={user.id} 
                                    isFollowing={followingIds.has(art.user.id)} onToggle={handleToggleFollow} 
                                />
                            </div>

                            {/* ẢNH */}
                            <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', backgroundColor: '#000' }}>
                                <img 
                                    src={`http://localhost:5000/api/artworks/images/${art.filePath}`} 
                                    alt={art.title} 
                                    style={{ width: '100%', display: 'block', minHeight: '200px', objectFit: 'contain', maxHeight: '600px' }}
                                    onError={(e) => { e.target.style.display = 'none'; }} 
                                />
                            </div>

                            {/* CAPTION */}
                            <p style={{ color: '#d4d4d8', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>{art.caption}</p>

                            {/* ACTIONS */}
                            <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                                <button onClick={() => handleToggleLike(art.id)} style={{ background: 'transparent', border: 'none', color: isLiked ? '#ef4444' : '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize:'14px' }}>
                                    <Heart size={20} fill={isLiked ? "#ef4444" : "none"} /> {art.likeCount || 0}
                                </button>
                                <button onClick={() => handleToggleComments(art.id)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize:'14px' }}>
                                    <MessageCircle size={20} /> Bình luận
                                </button>
                                <button onClick={() => handleOpenSaveModal(art.id)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', marginLeft:'auto' }}>
                                    <Bookmark size={20} />
                                </button>
                            </div>

                            {/* COMMENT SECTION */}
                            {expandedPostId === art.id && (
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '15px', paddingTop: '15px' }}>
                                    <form 
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSubmitComment(art.id, e.target.rootComment.value);
                                            e.target.rootComment.value = '';
                                        }} 
                                        style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}
                                    >
                                        <input name="rootComment" type="text" className="glass-input" placeholder="Viết bình luận..." autoComplete="off" />
                                        <button type="submit" className="btn-primary">Gửi</button>
                                    </form>
                                    <div>
                                        {comments.filter(c => !c.parent).map(c => (
                                            <CommentItem key={c.id} comment={c} allComments={comments} onReplySubmit={(pid, txt) => handleSubmitComment(art.id, txt, pid)} />
                                        ))}
                                        {comments.length === 0 && <p style={{color: '#666', fontSize: '13px', textAlign: 'center'}}>Chưa có bình luận nào.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* MODAL SAVE */}
            {showCollectionModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="glass-panel" style={{ width: '300px', padding: '20px', background: '#18181b', border: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: 'white' }}>Lưu vào...</h3>
                            <button onClick={() => setShowCollectionModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {myCollections.length > 0 ? myCollections.map(col => (
                                <button key={col.id} onClick={() => handleAddToCollection(col.id)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#d4d4d8', cursor: 'pointer', textAlign: 'left' }}>
                                    {col.name}
                                </button>
                            )) : <div style={{color: '#666', fontSize: '13px'}}>Chưa có bộ sưu tập nào.</div>}
                            <button onClick={() => {setShowCollectionModal(false); navigate('/favorites');}} style={{ marginTop: '10px', color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Plus size={16}/> Tạo bộ sưu tập mới
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Home;