import React, { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const CommentItem = ({ comment, replies, allComments, onReplySubmit }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    
    // State cục bộ để cập nhật UI ngay lập tức khi vote
    const [voteState, setVoteState] = useState({
        type: comment.userVoteType || 0,
        up: comment.upvoteCount || 0,
        down: comment.downvoteCount || 0
    });

    const handleVote = async (type) => {
        // Optimistic UI Update (Cập nhật giao diện trước khi gọi API)
        const oldState = { ...voteState };
        let newState = { ...voteState };

        if (voteState.type === type) {
            // Hủy vote (Click lại cái đã chọn)
            newState.type = 0;
            if (type === 1) newState.up--;
            else newState.down--;
            
            // Gọi API unvote (type = 0)
            axiosClient.post(`/comments/${comment.id}/vote?type=0`).catch(() => setVoteState(oldState));
        } else {
            // Đổi vote hoặc Vote mới
            // 1. Trừ vote cũ nếu có
            if (voteState.type === 1) newState.up--;
            if (voteState.type === -1) newState.down--;
            
            // 2. Cộng vote mới
            newState.type = type;
            if (type === 1) newState.up++;
            else newState.down++;

            // Gọi API
            axiosClient.post(`/comments/${comment.id}/vote?type=${type}`).catch(() => setVoteState(oldState));
        }
        setVoteState(newState);
    };

    const submitReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        await onReplySubmit(comment.id, replyText);
        setIsReplying(false);
        setReplyText('');
    };

    // Tìm các comment con của comment hiện tại
    const childComments = allComments.filter(c => c.parent && c.parent.id === comment.id);

    return (
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            {/* Cột trái: Avatar */}
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                {comment.user.username.charAt(0).toUpperCase()}
            </div>

            {/* Cột phải: Nội dung */}
            <div style={{ flex: 1 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#a1a1aa', marginBottom: '4px' }}>
                        {comment.user.username}
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.4', color: '#e4e4e7' }}>
                        {comment.content}
                    </div>
                </div>

                {/* Actions: Vote & Reply */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px', marginLeft: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button onClick={() => handleVote(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: voteState.type === 1 ? '#ef4444' : '#71717a', padding: '2px' }}>
                            <ArrowBigUp size={20} fill={voteState.type === 1 ? "#ef4444" : "none"} />
                        </button>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: voteState.type === 1 ? '#ef4444' : (voteState.type === -1 ? '#8b5cf6' : '#a1a1aa') }}>
                            {voteState.up - voteState.down}
                        </span>
                        <button onClick={() => handleVote(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: voteState.type === -1 ? '#8b5cf6' : '#71717a', padding: '2px' }}>
                            <ArrowBigDown size={20} fill={voteState.type === -1 ? "#8b5cf6" : "none"} />
                        </button>
                    </div>

                    <button onClick={() => setIsReplying(!isReplying)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={14} /> Trả lời
                    </button>
                </div>

                {/* Form trả lời */}
                {isReplying && (
                    <form onSubmit={submitReply} style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <input 
                            autoFocus
                            type="text" 
                            className="glass-input" 
                            style={{ padding: '8px', fontSize: '13px' }}
                            placeholder={`Trả lời ${comment.user.username}...`}
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '5px 15px', fontSize: '12px' }}>Gửi</button>
                    </form>
                )}

                {/* Đệ quy: Render các comment con */}
                {childComments.map(child => (
                    <CommentItem 
                        key={child.id} 
                        comment={child} 
                        allComments={allComments} 
                        onReplySubmit={onReplySubmit} 
                    />
                ))}
            </div>
        </div>
    );
};

export default CommentItem;