import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axiosClient from '../api/axiosClient';
import { Heart, Folder, Plus } from 'lucide-react';

const FavoritesPage = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [activeTab, setActiveTab] = useState('likes'); // 'likes' hoặc 'collections'
    const [likedArtworks, setLikedArtworks] = useState([]);
    const [collections, setCollections] = useState([]);
    
    // State cho việc tạo Collection mới
    const [newColName, setNewColName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (activeTab === 'likes') {
            axiosClient.get('/users/me/likes').then(data => setLikedArtworks(data || []));
        } else {
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
            // Reload list
            axiosClient.get('/users/me/collections').then(data => setCollections(data || []));
        } catch (error) {
            alert("Lỗi tạo bộ sưu tập");
        }
    }

    return (
        <div className="social-layout">
            <aside><Sidebar user={user} /></aside>
            <main className="no-scrollbar" style={{ overflowY: 'auto', height: 'calc(100vh - 48px)', padding: '20px' }}>
                
                {/* Header & Tabs */}
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '28px', background: 'linear-gradient(to right, #fff, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 20px 0' }}>
                        Thư viện của tôi
                    </h2>
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
                </div>

                {/* CONTENT: TAB LIKES */}
                {activeTab === 'likes' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {likedArtworks.map(art => (
                            <div key={art.id} className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}>
                                <img 
                                    src={`http://localhost:5000/api/artworks/images/${art.filePath}`} 
                                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                />
                                <div style={{ padding: '10px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{art.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* CONTENT: TAB COLLECTIONS */}
                {activeTab === 'collections' && (
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
                                        autoFocus
                                        type="text" 
                                        placeholder="Tên bộ sưu tập..." 
                                        className="glass-input"
                                        value={newColName}
                                        onChange={e => setNewColName(e.target.value)}
                                    />
                                    <button type="submit" className="btn-primary">Tạo</button>
                                    <button type="button" onClick={() => setIsCreating(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>Hủy</button>
                                </form>
                            )}
                        </div>

                        {/* Danh sách Collections */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                            {collections.map(col => (
                                <div key={col.id} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px', color: '#a78bfa' }}>
                                            <Folder size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0 }}>{col.name}</h4>
                                            <span style={{ fontSize: '12px', color: '#a1a1aa' }}>0 tranh</span>
                                        </div>
                                    </div>
                                    {/* Chỗ này sau này có thể hiện 3 ảnh nhỏ demo */}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FavoritesPage;