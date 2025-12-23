import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const RightSidebar = ({ user }) => {
    const navigate = useNavigate();
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);

    // Load dữ liệu
    useEffect(() => {
        if (user?.id) {
            axiosClient.get('/users/me/following')
                .then(res => setFollowing(res))
                .catch(err => console.error(err));

            axiosClient.get('/users/me/followers')
                .then(res => setFollowers(res))
                .catch(err => console.error(err));
        }
    }, [user]);

    if (!user) return null;

    return (
        <div className="right-sidebar-container">
            <div className="glass-panel" style={{ padding: '20px', height: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
                
                {/* --- DANH SÁCH 1: ĐANG THEO DÕI --- */}
                {/* CSS sẽ ẩn thẻ h4 này trên mobile */}
                <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#a78bfa', fontSize: '14px', textTransform: 'uppercase' }}>
                    Đang theo dõi ({following.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {following.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Avatar & Tên */}
                            <div 
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                onClick={() => navigate('/profile', { state: { userId: u.id } })}
                            >
                                {/* CSS Mobile sẽ bắt vào 'borderRadius: 50%' để phóng to Avatar */}
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                                {/* CSS Mobile sẽ bắt vào 'fontSize: 13px' để thu nhỏ tên hoặc ẩn đi */}
                                <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>
                                    {u.username}
                                </div>
                            </div>
                            
                            {/* Nút Chat (CSS Mobile sẽ ẩn nút này) */}
                            <button 
                                onClick={() => navigate('/chat', { state: { selectedUser: u } })}
                                style={{
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d4d4d8',
                                    borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: '0.2s'
                                }}
                                title="Nhắn tin"
                            >
                                <MessageCircle size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Đường kẻ (CSS sẽ ẩn trên mobile) */}
                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

                {/* --- DANH SÁCH 2: NGƯỜI THEO DÕI --- */}
                <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#f472b6', fontSize: '14px', textTransform: 'uppercase' }}>
                    Người theo dõi ({followers.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {followers.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div 
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                                onClick={() => navigate('/profile', { state: { userId: u.id } })}
                            >
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                    {u.username.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>
                                    {u.username}
                                </div>
                            </div>
                            <button 
                                onClick={() => navigate('/chat', { state: { selectedUser: u } })}
                                style={{
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#d4d4d8',
                                    borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <MessageCircle size={14} />
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default RightSidebar;