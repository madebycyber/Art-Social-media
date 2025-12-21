import React, { useEffect, useState, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import Sidebar from '../components/Sidebar';
import { Send, MoreVertical } from 'lucide-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useNavigate, useLocation } from 'react-router-dom';

const ChatPage = () => {
    // 1. Lấy User an toàn
    const [user] = useState(() => {
        try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    });

    const navigate = useNavigate();
    const location = useLocation();
    
    // State
    const [chatRooms, setChatRooms] = useState([]); 
    const [activeRoom, setActiveRoom] = useState(null); 
    const [messages, setMessages] = useState([]);
    const [msgContent, setMsgContent] = useState("");
    
    // Refs
    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);
    const userRef = useRef(user); // Dùng Ref để truy cập user trong callback của socket mà không cần dependency

    // --- HELPER: Format thời gian ---
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth();
        return isToday 
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : date.toLocaleDateString();
    };

    // --- CHECK LOGIN ---
    useEffect(() => {
        if (!user || !user.id) navigate('/login');
    }, [user, navigate]);

    // --- 1. LOAD DANH SÁCH CHAT ROOMS ---
    useEffect(() => {
        if (user?.id) {
            axiosClient.get('/users/me/chat-rooms')
                .then(res => {
                    if (Array.isArray(res)) setChatRooms(res);
                })
                .catch(err => console.error("Lỗi tải chat rooms:", err));
        }
    }, [user]);

    // --- 2. XỬ LÝ ĐIỀU HƯỚNG TỪ HOME ---
    useEffect(() => {
        if (location.state?.selectedUser) {
            const targetUser = location.state.selectedUser;
            const existingRoom = chatRooms.find(r => r.recipientId === targetUser.id);
            
            if (existingRoom) {
                setActiveRoom(existingRoom);
            } else {
                const tempRoom = {
                    roomId: null,
                    recipientId: targetUser.id,
                    recipientName: targetUser.username,
                    lastMessage: "Bắt đầu cuộc trò chuyện mới",
                    unreadCount: 0
                };
                setChatRooms(prev => [tempRoom, ...prev]);
                setActiveRoom(tempRoom);
            }
        }
    }, [location.state, chatRooms]);

    // --- 3. KẾT NỐI WEBSOCKET (ĐÃ SỬA LỖI MESSAGE NHÂN BẢN) ---
    useEffect(() => {
        if (!user?.id) return;

        // Nếu đã có kết nối rồi thì không kết nối lại (Fix lỗi nhân bản tin nhắn)
        if (stompClientRef.current && stompClientRef.current.connected) return;

        const socket = new SockJS('http://localhost:5000/ws');
        const stompClient = Stomp.over(socket);
        stompClient.debug = null; // Tắt log console cho gọn

        stompClient.connect({}, () => {
            // console.log("Connected to WebSocket");
            
            // Subscribe chỉ 1 lần duy nhất
            stompClient.subscribe(`/user/${user.id}/queue/messages`, (payload) => {
                const receivedMsg = JSON.parse(payload.body);
                handleIncomingMessage(receivedMsg);
            });
        }, (err) => console.error("WS Error:", err));

        stompClientRef.current = stompClient;

        // Cleanup: Ngắt kết nối khi rời trang
        return () => {
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect();
            }
            stompClientRef.current = null;
        };
    }, [user]); // Dependency chỉ là user, không bao giờ thêm messages hay activeRoom vào đây

    // --- LOGIC: XỬ LÝ TIN NHẮN ĐẾN ---
    const handleIncomingMessage = (msg) => {
        // Sử dụng functional update để luôn lấy state mới nhất mà không cần đưa vào dependency
        setActiveRoom(currentActive => {
            // Kiểm tra xem tin nhắn này có thuộc về phòng đang mở không
            // (Là tin người khác gửi đến phòng này HOẶC là tin mình vừa gửi đi được server echo về)
            const isRelated = currentActive && (msg.senderId === currentActive.recipientId || msg.recipientId === currentActive.recipientId);
            
            if (isRelated) {
                setMessages(prev => {
                    // Chống trùng lặp (nếu mạng lag gửi 2 lần)
                    if (prev.some(m => m.id === msg.id && m.id !== null)) return prev;
                    return [...prev, msg];
                });
            }
            return currentActive;
        });

        // Update Sidebar (Đẩy lên đầu)
        setChatRooms(prevRooms => {
            const partnerId = msg.senderId === userRef.current.id ? msg.recipientId : msg.senderId;
            const existingIndex = prevRooms.findIndex(r => r.recipientId === partnerId);
            
            let updatedRoom;
            if (existingIndex > -1) {
                updatedRoom = {
                    ...prevRooms[existingIndex],
                    lastMessage: msg.senderId === userRef.current.id ? `Bạn: ${msg.content}` : msg.content,
                    lastMessageAt: new Date(),
                    unreadCount: 0 // Reset tạm thời nếu đang mở
                };
                const newRooms = [...prevRooms];
                newRooms.splice(existingIndex, 1);
                return [updatedRoom, ...newRooms];
            } else {
                // Nếu là tin nhắn mới từ người lạ, reload lại list cho chắc
                axiosClient.get('/users/me/chat-rooms').then(res => setChatRooms(res));
                return prevRooms;
            }
        });
    };

    // --- 4. LOAD LỊCH SỬ TIN NHẮN ---
    useEffect(() => {
        if (activeRoom && user) {
            axiosClient.get(`/messages/${user.id}/${activeRoom.recipientId}`)
                .then(data => {
                    setMessages(data || []);
                    scrollToBottom();
                });
        }
    }, [activeRoom]);

    // Auto scroll
    useEffect(() => { scrollToBottom(); }, [messages]);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // --- GỬI TIN NHẮN ---
    const sendMessage = (e) => {
        e.preventDefault();
        if (!msgContent.trim() || !activeRoom) return;

        if (!stompClientRef.current || !stompClientRef.current.connected) {
            alert("Mất kết nối! Vui lòng tải lại trang.");
            return;
        }

        const chatMessage = {
            senderId: user.id,
            recipientId: activeRoom.recipientId,
            content: msgContent
        };

        // Gửi lên Server
        stompClientRef.current.send("/app/chat", {}, JSON.stringify(chatMessage));
        
        // QUAN TRỌNG: Không setMessages ở đây nữa (để tránh bị double tin nhắn).
        // Ta đợi Server phản hồi về qua WebSocket rồi mới hiển thị.
        setMsgContent("");
    };

    if (!user) return null;

    return (
        <div className="social-layout">
            <aside><Sidebar user={user} /></aside>
            
            <main style={{ height: 'calc(100vh - 48px)', display: 'flex', gap: '20px', padding: '20px' }}>
                
                {/* --- SIDEBAR LIST CHAT --- */}
                <div className="glass-panel" style={{ width: '320px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ margin: 0, color: 'white' }}>Đoạn chat</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {chatRooms.map(room => (
                            <div 
                                key={room.recipientId}
                                onClick={() => setActiveRoom(room)}
                                style={{
                                    display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer', marginBottom: '5px',
                                    background: activeRoom?.recipientId === room.recipientId ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                                }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                                    {room.recipientName?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '600', color: 'white' }}>{room.recipientName}</span>
                                        <span style={{ fontSize: '11px', color: '#888' }}>{formatTime(room.lastMessageAt)}</span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {room.lastMessage || "Chưa có tin nhắn"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- CHAT WINDOW --- */}
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {activeRoom ? (
                        <>
                            {/* Header */}
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                    <div style={{width:'36px', height:'36px', borderRadius:'50%', background:'#444', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                        {activeRoom.recipientName?.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{fontWeight:'bold'}}>{activeRoom.recipientName}</span>
                                </div>
                                <MoreVertical size={20} color="#888" />
                            </div>

                            {/* --- MESSAGE LIST (ĐÃ SỬA GIAO DIỆN) --- */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {messages.map((msg, index) => {
                                    // Kiểm tra xem tin nhắn này là của TÔI hay NGƯỜI KHÁC
                                    const isMe = msg.senderId.toString() === user.id;

                                    return (
                                        <div key={index} style={{ 
                                            display: 'flex', 
                                            justifyContent: isMe ? 'flex-end' : 'flex-start', // Căn phải nếu là mình, trái nếu là họ
                                            marginBottom: '4px'
                                        }}>
                                            <div style={{ 
                                                maxWidth: '70%',
                                                padding: '10px 15px', 
                                                fontSize: '14px',
                                                lineHeight: '1.4',
                                                // MÀU SẮC KHÁC BIỆT
                                                background: isMe ? '#8b5cf6' : '#3f3f46', // Tím (User) vs Xám đậm (Khách)
                                                color: 'white',
                                                // BO GÓC KHÁC BIỆT
                                                borderRadius: '18px',
                                                borderBottomRightRadius: isMe ? '4px' : '18px', // Nhọn góc dưới phải nếu là mình
                                                borderBottomLeftRadius: isMe ? '18px' : '4px'   // Nhọn góc dưới trái nếu là họ
                                            }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Form */}
                            <form onSubmit={sendMessage} style={{ padding: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    className="glass-input" 
                                    style={{ flex: 1, borderRadius: '24px', padding: '12px 20px' }} 
                                    placeholder="Nhập tin nhắn..." 
                                    value={msgContent}
                                    onChange={e => setMsgContent(e.target.value)}
                                />
                                <button type="submit" className="btn-primary" style={{ borderRadius: '50%', width: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', flexDirection: 'column' }}>
                            <div style={{fontSize: '40px'}}>💬</div>
                            <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
export default ChatPage;