import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { UploadCloud, X, Image as ImageIcon, Loader, Lock, Globe, Users } from 'lucide-react';

const UploadPage = () => {
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');
    const [privacy, setPrivacy] = useState('PUBLIC'); // State cho Privacy
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const clearFile = () => {
        setFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert("Bạn chưa chọn tranh để đăng!");
        
        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('caption', caption);
        formData.append('privacy', privacy); // Gửi Privacy lên server
        formData.append('file', file);

        try {
            await axiosClient.post('/artworks', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/');
        } catch (err) {
            alert("Lỗi: " + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="social-layout">

            <main className="no-scrollbar" style={{ overflowY: 'auto', height: 'calc(100vh - 48px)', paddingTop: '20px', display: 'flex', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '30px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '24px', color: 'white' }}>Đăng tác phẩm mới</h2>

                    <form onSubmit={handleSubmit}>
                        {/* Vùng chọn ảnh giữ nguyên */}
                        <div style={{ marginBottom: '24px' }}>
                            {!previewUrl ? (
                                <label style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '16px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }}>
                                    <UploadCloud size={48} color="#a1a1aa" />
                                    <span style={{ color: '#d4d4d8', marginTop: '10px' }}>Nhấn để tải ảnh lên</span>
                                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                </label>
                            ) : (
                                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                                    <img src={previewUrl} alt="Preview" style={{ width: '100%' }} />
                                    <button type="button" onClick={clearFile} style={{ position: 'absolute', top: 10, right: 10, borderRadius: '50%', width: 30, height: 30, border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white', cursor: 'pointer' }}><X size={16}/></button>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa' }}>Tiêu đề</label>
                            <input className="glass-input" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>

                        {/* Caption */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa' }}>Mô tả</label>
                            <textarea className="glass-input" rows="3" value={caption} onChange={e => setCaption(e.target.value)} />
                        </div>

                        {/* --- NEW: Privacy Select --- */}
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa' }}>Quyền riêng tư</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {[
                                    { value: 'PUBLIC', label: 'Công khai', icon: Globe },
                                    { value: 'FOLLOWER', label: 'Người theo dõi', icon: Users },
                                    { value: 'PRIVATE', label: 'Chỉ mình tôi', icon: Lock }
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setPrivacy(option.value)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '10px',
                                            border: privacy === option.value ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
                                            background: privacy === option.value ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                                            color: privacy === option.value ? 'white' : '#a1a1aa',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}
                                    >
                                        <option.icon size={16} /> {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            {loading ? <Loader className="spin" /> : <ImageIcon />} Đăng tác phẩm
                        </button>
                    </form>
                </div>
            </main>
             <aside></aside>
        </div>
    );
};
export default UploadPage;