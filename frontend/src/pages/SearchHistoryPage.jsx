import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
// Thêm icon Plus cho nút Thêm mới
import { Search, X, Edit2, Trash2, Calendar, AlertTriangle, Plus } from 'lucide-react';

const SearchHistoryPage = () => {
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States cho CRUD
    const [newKeyword, setNewKeyword] = useState(""); // Dành cho chức năng NHẬP
    const [editingKeyword, setEditingKeyword] = useState(null); // Dành cho chức năng SỬA
    const [newKeywordValue, setNewKeywordValue] = useState(""); // Giá trị khi đang sửa
    const [searchTerm, setSearchTerm] = useState(""); // Dành cho chức năng LỌC

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    // --- 1. TRUY VẤN (Read) ---
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await axiosClient.get('/redis/search-history');
            setHistoryItems(data || []);
        } catch (error) {
            console.error("Lỗi lấy lịch sử:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- 2. NHẬP (Insert / Create) - MỚI THÊM ---
    const handleAddKeyword = async (e) => {
        e.preventDefault(); // Chặn load lại trang khi submit form
        if (!newKeyword.trim()) return;
        try {
            await axiosClient.post(`/redis/search-history?keyword=${encodeURIComponent(newKeyword.trim())}`);
            setNewKeyword(""); // Xóa ô input sau khi thêm thành công
            fetchHistory(); // Tải lại danh sách
        } catch (error) {
            alert("Lỗi thêm từ khóa.");
        }
    };

    // --- 3. SỬA (Update) ---
    const handleStartEdit = (keyword) => {
        setEditingKeyword(keyword);
        setNewKeywordValue(keyword);
    };

    const handleConfirmEdit = async () => {
        if (!newKeywordValue.trim() || newKeywordValue === editingKeyword) {
            setEditingKeyword(null);
            return;
        }
        try {
            await axiosClient.put(`/redis/search-history?keyword=${encodeURIComponent(newKeywordValue.trim())}`);
            
            if (newKeywordValue !== editingKeyword) {
                 await axiosClient.delete(`/redis/search-history?keyword=${encodeURIComponent(editingKeyword)}`);
            }
            setEditingKeyword(null);
            fetchHistory(); 
        } catch (error) {
            alert("Lỗi sửa.");
        }
    };

    // --- 4. XÓA (Delete) ---
    const handleDelete = async (keyword) => {
        if (!window.confirm(`Xóa từ khóa "${keyword}" khỏi lịch sử?`)) return;
        try {
            await axiosClient.delete(`/redis/search-history?keyword=${encodeURIComponent(keyword)}`);
            fetchHistory();
        } catch (error) {
            console.error("Lỗi xóa:", error);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Xóa SẠCH toàn bộ lịch sử tìm kiếm của bạn?")) return;
        try {
            await axiosClient.delete('/redis/search-history/clear-all');
            setHistoryItems([]);
        } catch (error) {
            alert("Lỗi xóa.");
        }
    };

    // --- 5. LỌC (Filter) ---
    const filteredHistory = historyItems.filter(item => 
        item.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return <div style={{color:'white', padding:20}}>Vui lòng đăng nhập.</div>;

    return (
        <div className="social-layout">
            <main className="no-scrollbar" style={{ overflowY: 'auto', height: 'calc(100vh - 20px)', padding: '0 20px 20px 0' }}>
                
                {/* HEADER */}
                <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                            <Search size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '24px', margin: 0, color: 'white' }}>Bảng điều khiển Redis</h2>
                            <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Quản lý lịch sử tìm kiếm (Nhập, Sửa, Xóa, Lọc)</span>
                        </div>
                    </div>
                    {historyItems.length > 0 && (
                        <button onClick={handleClearAll} className="btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', display:'flex', alignItems:'center', gap:'6px' }}>
                            <AlertTriangle size={16}/> Xóa sạch lịch sử
                        </button>
                    )}
                </div>

                {/* KHU VỰC THÊM MỚI VÀ LỌC */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    
                    {/* FORM NHẬP (CREATE) */}
                    <form onSubmit={handleAddKeyword} className="glass-panel" style={{ flex: 1, padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Plus size={18} color="#8b5cf6" />
                        <input 
                            type="text" 
                            placeholder="Nhập từ khóa mới vào Redis..." 
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: '14px' }}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>Thêm</button>
                    </form>

                    {/* FORM LỌC (FILTER) */}
                    <div className="glass-panel" style={{ flex: 1, padding: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Search size={18} color="#666" />
                        <input 
                            type="text" 
                            placeholder="Lọc / Tìm kiếm trong lịch sử..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: '14px' }}
                        />
                    </div>
                </div>

                {/* DANH SÁCH LỊCH SỬ (GRID) */}
                {loading ? (
                    <div style={{ color: '#aaa', textAlign: 'center', padding: '50px' }}>Đang tải...</div>
                ) : filteredHistory.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: '#aaa' }}>
                        <X size={40} style={{ opacity: 0.3, marginBottom:'10px' }}/>
                        <p>Không có lịch sử tìm kiếm nào{searchTerm && ` phù hợp với "${searchTerm}"`}.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {filteredHistory.map((keyword) => (
                            <div key={keyword} className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px', position:'relative', border: editingKeyword === keyword ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.05)' }}>
                                
                                <div style={{display:'flex', alignItems:'center', gap:'10px', color:'#a1a1aa', fontSize:'12px'}}>
                                    <Calendar size={14}/> <span>Vừa tìm gần đây</span>
                                </div>

                                {/* Khu vực hiển thị/sửa từ khóa */}
                                {editingKeyword === keyword ? (
                                    <input 
                                        type="text" 
                                        value={newKeywordValue}
                                        onChange={(e) => setNewKeywordValue(e.target.value)}
                                        className="glass-input"
                                        style={{ fontSize: '15px', padding:'5px 10px' }}
                                        autoFocus
                                        onKeyPress={(e) => e.key === 'Enter' && handleConfirmEdit()}
                                    />
                                ) : (
                                    <p style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {keyword}
                                    </p>
                                )}

                                {/* NÚT ACTIONS */}
                                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'10px' }}>
                                    {editingKeyword === keyword ? (
                                        <>
                                            <button onClick={handleConfirmEdit} className="btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }}>Lưu</button>
                                            <button onClick={() => setEditingKeyword(null)} style={{ background: 'none', border: '1px solid #52525b', color: 'white', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer' }}>Hủy</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleStartEdit(keyword)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'12px' }}
                                                onMouseEnter={(e)=>e.currentTarget.style.color='white'}
                                                onMouseLeave={(e)=>e.currentTarget.style.color='#a1a1aa'}
                                            >
                                                <Edit2 size={14} /> Sửa
                                            </button>
                                            <button onClick={() => handleDelete(keyword)} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', marginLeft:'auto' }}>
                                                <Trash2 size={14} /> Xóa
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SearchHistoryPage;