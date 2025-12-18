import React from 'react';
import { UserPlus, UserCheck } from 'lucide-react';

const FollowButton = ({ targetUserId, myId, isFollowing, onToggle }) => {
    // Không hiện nút nếu là chính mình
    if (targetUserId === myId) return null;

    return (
        <button 
            onClick={(e) => {
                e.stopPropagation(); // Ngăn click lan ra ngoài
                onToggle(targetUserId);
            }}
            style={{
                background: isFollowing ? 'rgba(139, 92, 246, 0.2)' : 'white',
                color: isFollowing ? '#8b5cf6' : '#18181b',
                border: isFollowing ? '1px solid #8b5cf6' : '1px solid #e4e4e7',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                minWidth: '110px', // Đảm bảo độ rộng không bị nhảy khi đổi chữ
                justifyContent: 'center'
            }}
        >
            {isFollowing ? (
                <> <UserCheck size={16} /> Đang theo dõi </>
            ) : (
                <> <UserPlus size={16} /> Theo dõi </>
            )}
        </button>
    );
};

export default FollowButton;