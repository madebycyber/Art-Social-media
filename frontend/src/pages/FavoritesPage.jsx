import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { Heart, Folder, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImagePreviewModal from '../components/ImagePreviewModal';

const FavoritesPage = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('likes'); 
    const [likedArtworks, setLikedArtworks] = useState([]);
    
    // State quản lý Collection
    const [previewImage, setPreviewImage] = useState(null);
    const [collections, setCollections] = useState([]);
    const [newColName, setNewColName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    // State mới: Bộ sưu tập đang xem chi tiết (null = đang xem danh sách)
    const [viewingCollection, setViewingCollection] = useState(null); 

    useEffect(() => {
        if (activeTab === 'likes') {
            axiosClient.get('/users/me/likes').then(data => setLikedArtworks(data || []));
        } else {
            // Khi load collection, Backend cần trả về kèm list items
            axiosClient.get('/users/me/collections').then(data => setCollections(data || []));
        }
    }, [activeTab]);

    const handleCreateCollection = async (e) => {
        e.preventDefault();
        if(!newColName) return;
        try {
            await axiosClient.post(`/users/me/collections?name=${newColName}`);
            setNewColName('');
            setIsCreating(false);
            const data = await axiosClient.get('/users/me/collections');
            setCollections(data || []);
        } catch (error) {
            alert("Lỗi tạo bộ sưu tập");
        }
    }

    // --- HÀM CLICK VÀO ẢNH ĐỂ VỀ HOME ---
    const handleArtworkClick = (artId) => {
        // Chuyển hướng về Home và mang theo ID bài viết cần cuộn tới
        navigate('/', { state: { scrollToId: artId } });
    };

    return (
        <div className="social-layout">
            <main className="no-scrollbar" style={{ overflowY: 'auto', height: 'calc(100vh - 48px)', padding: '20px' }}>
                
                {/* Header & Tabs */}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '28px', background: 'linear-gradient(to right, #fff, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 20px 0' }}>
                        Thư viện của tôi
                    </h2>
                    
                    {/* Ẩn Tabs nếu đang xem chi tiết Collection */}
                    {!viewingCollection && (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => setActiveTab('likes')}
                                className={activeTab === 'likes' ? 'btn-primary' : 'glass-panel'}
                                style={{ padding: '10px 20px', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                <Heart size={18} /> Đã thích
                            </button>
                            <button 
                                onClick={() => setActiveTab('collections')}
                                className={activeTab === 'collections' ? 'btn-primary' : 'glass-panel'}
                                style={{ padding: '10px 20px', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}
                            >
                                <Folder size={18} /> Bộ sưu tập
                            </button>
                        </div>
                    )}
                </div>

                {/* --- CASE 1: XEM TAB LIKES --- */}
                {activeTab === 'likes' && !viewingCollection && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {likedArtworks.map(art => (
                            <div 
                                key={art.id} 
                                className="glass-panel" 
                                style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onClick={() => handleArtworkClick(art.id)}
                            >
                                <img 
                                    src={`http://localhost:5000/api/artworks/images/${art.filePath}`} 
                                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                    alt={art.title}
                                />
                                <div style={{ padding: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{art.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- CASE 2: XEM DANH SÁCH COLLECTIONS --- */}
                {activeTab === 'collections' && !viewingCollection && (
                    <div>
                        {/* Nút tạo mới */}
                        <div style={{ marginBottom: '20px' }}>
                            {!isCreating ? (
                                <button onClick={() => setIsCreating(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.3)', width: '100%', padding: '15px', borderRadius: '12px', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <Plus size={20} /> Tạo bộ sưu tập mới
                                </button>
                            ) : (
                                <form onSubmit={handleCreateCollection} className="glass-panel" style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                                    <input 
                                        autoFocus type="text" placeholder="Tên bộ sưu tập..." className="glass-input"
                                        value={newColName} onChange={e => setNewColName(e.target.value)}
                                    />
                                    <button type="submit" className="btn-primary">Tạo</button>
                                    <button type="button" onClick={() => setIsCreating(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>Hủy</button>
                                </form>
                            )}
                        </div>

                        {/* Grid Collections */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                            {collections.map(col => {
                                // Tính số lượng tranh (An toàn check null)
                                const count = col.collectionItems ? col.collectionItems.length : 0;
                                
                                return (
                                    <div 
                                        key={col.id} 
                                        className="glass-panel" 
                                        style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer' }}
                                        onClick={() => setViewingCollection(col)} // <--- CLICK ĐỂ XEM CHI TIẾT
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px', color: '#a78bfa' }}>
                                                <Folder size={24} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0 }}>{col.name}</h4>
                                                {/* Hiển thị số lượng đúng */}
                                                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{count} tranh</span>
                                            </div>
                                        </div>
                                        
                                        {/* Preview 3 ảnh nhỏ (Nếu có) */}
                                        <div style={{display: 'flex', gap: '5px', marginTop: '5px'}}>
                                            {col.collectionItems?.slice(0, 3).map(item => (
                                                <div key={item.id} style={{width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#333'}}>
                                                    <img src={`http://localhost:5000/api/artworks/images/${item.artwork.filePath}`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- CASE 3: XEM CHI TIẾT MỘT COLLECTION --- */}
                {viewingCollection && (
                    <div>
                        {/* Header chi tiết */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                            <button 
                                onClick={() => setViewingCollection(null)} 
                                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px' }}>{viewingCollection.name}</h3>
                                <span style={{ color: '#a1a1aa', fontSize: '13px' }}>
                                    {viewingCollection.collectionItems?.length || 0} tranh
                                </span>
                            </div>
                        </div>

                        {/* Danh sách tranh trong collection */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {viewingCollection.collectionItems && viewingCollection.collectionItems.map(item => (
                                <div 
                                    key={item.id} 
                                    className="glass-panel" 
                                    style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}
                                    onClick={() => handleArtworkClick(item.artwork.id)} // <--- CLICK VỀ HOME
                                >
                                    <img 
                                        src={`http://localhost:5000/api/artworks/images/${item.artwork.filePath}`} 
                                        onClick={() => setPreviewImage(item.artwork.imageUrl)}
                                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                        alt={item.artwork.title}
                                    />
                                    <div style={{ padding: '10px' }}>
                                        <h4 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.artwork.title}</h4>
                                    </div>
                                </div>
                            ))}
                            
                            {(!viewingCollection.collectionItems || viewingCollection.collectionItems.length === 0) && (
                                <p style={{color: '#666'}}>Bộ sưu tập này trống.</p>
                            )}
                        </div>
                        <ImagePreviewModal 
                            isOpen={!!previewImage} 
                            imageUrl={previewImage} 
                            onClose={() => setPreviewImage(null)} 
                        />
                    </div>
                )}

            </main>
        </div>
    );
};

export default FavoritesPage;