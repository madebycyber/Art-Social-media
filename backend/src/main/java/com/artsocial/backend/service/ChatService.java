package com.artsocial.backend.service;

import com.artsocial.backend.entity.ChatMessage;
import com.artsocial.backend.entity.ChatRoom;
import com.artsocial.backend.repository.ChatMessageRepository;
import com.artsocial.backend.repository.ChatRoomRepository;
import com.artsocial.backend.util.EncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
public class ChatService {

    @Autowired private ChatMessageRepository messageRepository;
    @Autowired private ChatRoomRepository chatRoomRepository;

    public String getChatId(Long senderId, Long recipientId) {
        if (senderId < recipientId) return senderId + "_" + recipientId;
        else return recipientId + "_" + senderId;
    }

    @Transactional
    public ChatMessage save(ChatMessage message) {
        // 1. Setup Chat ID và Time
        String chatId = getChatId(message.getSenderId(), message.getRecipientId());
        message.setChatId(chatId);
        message.setCreatedAt(new Date());

        String rawContent = message.getContent(); // Nội dung gốc (để hiển thị preview)
        message.setContent(EncryptionUtil.encrypt(rawContent)); // Mã hóa (để lưu DB)

        // 2. Cập nhật Room cho cả 2 bên (Sử dụng hàm updateRoom bên dưới cho gọn)
        updateRoom(message.getSenderId(), message.getRecipientId(), chatId, "Bạn: " + rawContent, false);
        updateRoom(message.getRecipientId(), message.getSenderId(), chatId, rawContent, true);

        // 3. Lưu tin nhắn
        return messageRepository.save(message);
    }

    // Hàm phụ để tránh viết lặp code 2 lần
    private void updateRoom(Long ownerId, Long partnerId, String chatId, String lastMessage, boolean incrementUnread) {
        ChatRoom room = chatRoomRepository.findBySenderIdAndRecipientId(ownerId, partnerId)
                .orElse(null);

        if (room == null) {
            room = ChatRoom.builder()
                    .chatId(chatId)
                    .senderId(ownerId)
                    .recipientId(partnerId)
                    .unreadCount(0)
                    .build();
        }

        room.setLastMessage(lastMessage);
        room.setLastMessageAt(new Date());

        if (incrementUnread) {
            int current = (room.getUnreadCount() == null) ? 0 : room.getUnreadCount();
            room.setUnreadCount(current + 1);
        }

        chatRoomRepository.save(room);
    }

    public List<ChatMessage> findChatMessages(Long senderId, Long recipientId) {
        String chatId = getChatId(senderId, recipientId);
        List<ChatMessage> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
        messages.forEach(m -> m.setContent(EncryptionUtil.decrypt(m.getContent())));
        return messages;
    }
}