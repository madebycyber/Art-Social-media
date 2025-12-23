import React, { useEffect, useState, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import Sidebar from '../components/Sidebar';
import { Send, MoreVertical, Bot } from 'lucide-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown'; // Import Markdown
import remarkGfm from 'remark-gfm';         // Import Plugin GFM

const ChatPage = () => {
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
    
    // --- STATE MỚI: Hiển thị Bot đang suy nghĩ ---
    const [isBotThinking, setIsBotThinking] = useState(false);
    
    // Refs
    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);
    const userRef = useRef(user);

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
            startChatWithUser(targetUser);
        }
    }, [location.state, chatRooms]);

    // Hàm chung để bắt đầu chat (dùng cho cả User thường và Bot)
    const startChatWithUser = (targetUser) => {
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
    };

    // Hàm mở chat Bot (gọi từ nút bấm)
    const startBotChat = () => {
        const botUser = { id: 9999, username: "Gemini AI" };
        startChatWithUser(botUser);
    };

    // --- 3. KẾT NỐI WEBSOCKET ---
    useEffect(() => {
        if (!user?.id) return;
        if (stompClientRef.current && stompClientRef.current.connected) return;

        const socket = new SockJS('http://localhost:5000/ws');
        const stompClient = Stomp.over(socket);
        stompClient.debug = null;

        stompClient.connect({}, () => {
            stompClient.subscribe(`/user/${user.id}/queue/messages`, (payload) => {
                const receivedMsg = JSON.parse(payload.body);
                handleIncomingMessage(receivedMsg);
            });
        }, (err) => console.error("WS Error:", err));

        stompClientRef.current = stompClient;

        return () => {
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect();
            }
            stompClientRef.current = null;
        };
    }, [user]);

    // --- LOGIC: XỬ LÝ TIN NHẮN ĐẾN ---
    const handleIncomingMessage = (msg) => {
        setActiveRoom(currentActive => {
            const isRelated = currentActive && (msg.senderId === currentActive.recipientId || msg.recipientId === currentActive.recipientId);
            
            if (isRelated) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id && m.id !== null)) return prev;
                    return [...prev, msg];
                });

                // --- LOGIC MỚI: NẾU NHẬN ĐƯỢC TIN TỪ BOT -> TẮT LOADING ---
                if (msg.senderId === 9999) {
                    setIsBotThinking(false);
                }
            }
            return currentActive;
        });

        // Update Sidebar
        setChatRooms(prevRooms => {
            const partnerId = msg.senderId === userRef.current.id ? msg.recipientId : msg.senderId;
            const existingIndex = prevRooms.findIndex(r => r.recipientId === partnerId);
            
            let updatedRoom;
            if (existingIndex > -1) {
                updatedRoom = {
                    ...prevRooms[existingIndex],
                    lastMessage: msg.senderId === userRef.current.id ? `Bạn: ${msg.content}` : msg.content,
                    lastMessageAt: new Date(),
                    unreadCount: 0 
                };
                const newRooms = [...prevRooms];
                newRooms.splice(existingIndex, 1);
                return [updatedRoom, ...newRooms];
            } else {
                axiosClient.get('/users/me/chat-rooms').then(res => setChatRooms(res));
                return prevRooms;
            }
        });
    };

    // --- 4. LOAD LỊCH SỬ TIN NHẮN ---
    useEffect(() => {
        if (activeRoom && user) {
            // Reset trạng thái thinking khi chuyển phòng
            setIsBotThinking(false);
            
            axiosClient.get(`/messages/${user.id}/${activeRoom.recipientId}`)
                .then(data => {
                    setMessages(data || []);
                    scrollToBottom();
                });
        }
    }, [activeRoom]);

    useEffect(() => { scrollToBottom(); }, [messages, isBotThinking]); // Scroll khi có tin mới hoặc khi bot đang nghĩ
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

        stompClientRef.current.send("/app/chat", {}, JSON.stringify(chatMessage));
        
        // --- LOGIC MỚI: NẾU GỬI CHO BOT -> BẬT LOADING ---
        if (activeRoom.recipientId === 9999) {
            setIsBotThinking(true);
        }

        setMsgContent("");
    };

    if (!user) return null;

    return (
        <div className="social-layout">
            <aside><Sidebar user={user} /></aside>
            
            <main style={{ height: 'calc(100vh - 48px)', display: 'flex', gap: '20px', padding: '20px' }}>
                
                {/* SIDEBAR */}
                <div className="glass-panel" style={{ width: '320px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>Đoạn chat</h3>
                        <button 
                            onClick={startBotChat}
                            style={{
                                width: '100%', padding: '10px', background: 'linear-gradient(90deg, #2563eb, #9333ea)',
                                border: 'none', borderRadius: '10px', color: 'white', fontWeight: 'bold',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                            }}
                        >
                            <Bot size={20} /> Chat với Gemini AI
                        </button>
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

                {/* CHAT WINDOW */}
                <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {activeRoom ? (
                        <>
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                                    <div style={{width:'36px', height:'36px', borderRadius:'50%', background: activeRoom.recipientId === 9999 ? 'linear-gradient(45deg, #2563eb, #9333ea)' : '#444', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                        {activeRoom.recipientId === 9999 ? <Bot size={20} color="white"/> : activeRoom.recipientName?.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{fontWeight:'bold'}}>{activeRoom.recipientName}</span>
                                </div>
                                <MoreVertical size={20} color="#888" />
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId.toString() === user.id;
                                    const isBot = msg.senderId === 9999;
                                    
                                    return (
                                        <div key={index} style={{ 
                                            display: 'flex', 
                                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                                            marginBottom: '4px'
                                        }}>
                                            <div 
                                                className={`chat-bubble ${isMe ? 'me' : 'other'}`} // Thêm class để CSS
                                                style={{ 
                                                    maxWidth: '75%',
                                                    padding: '10px 15px', 
                                                    fontSize: '14px',
                                                    lineHeight: '1.5',
                                                    background: isMe ? '#8b5cf6' : (isBot ? '#1f2937' : '#3f3f46'), // Bot màu tối hơn chút
                                                    color: 'white',
                                                    borderRadius: '18px',
                                                    borderBottomRightRadius: isMe ? '4px' : '18px',
                                                    borderBottomLeftRadius: isMe ? '18px' : '4px',
                                                    border: isBot ? '1px solid #374151' : 'none', // Viền cho Bot
                                                }}
                                            >
                                                {/* --- HIỂN THỊ MARKDOWN --- */}
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* --- HIỆU ỨNG AI ĐANG SUY NGHĨ --- */}
                                {isBotThinking && activeRoom.recipientId === 9999 && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '4px' }}>
                                        <div style={{ 
                                            background: '#1f2937', color: '#9ca3af', 
                                            padding: '10px 15px', borderRadius: '18px', borderBottomLeftRadius: '4px',
                                            fontSize: '13px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '5px',
                                            border: '1px solid #374151'
                                        }}>
                                            <Bot size={16} className="thinking-icon" /> 
                                            <span>Gemini đang suy nghĩ<span className="typing-dots">...</span></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={sendMessage} style={{ padding: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    className="glass-input" 
                                    style={{ flex: 1, borderRadius: '24px', padding: '12px 20px' }} 
                                    placeholder={activeRoom.recipientId === 9999 ? "Hỏi Gemini AI bất cứ điều gì..." : "Nhập tin nhắn..."}
                                    value={msgContent}
                                    onChange={e => setMsgContent(e.target.value)}
                                    disabled={isBotThinking} // Chặn gửi khi bot chưa trả lời xong (tùy chọn)
                                />
                                <button type="submit" className="btn-primary" disabled={isBotThinking} style={{ borderRadius: '50%', width: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isBotThinking ? 0.5 : 1 }}>
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