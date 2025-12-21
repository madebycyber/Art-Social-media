package com.artsocial.backend.controller;

import com.artsocial.backend.entity.ChatMessage;
import com.artsocial.backend.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.artsocial.backend.util.EncryptionUtil; // Import để decrypt lúc gửi socket

import java.util.List;

@Controller
public class ChatController {

    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private ChatService chatService;

    // 1. Nhận tin nhắn từ WebSocket và gửi đi
    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessage chatMessage) {
        // Lưu vào DB (Đã mã hóa trong service)
        ChatMessage saved = chatService.save(chatMessage);
        
        // Khi gửi ra socket cho người nhận xem, phải gửi bản rõ (đã giải mã)
        saved.setContent(EncryptionUtil.decrypt(saved.getContent()));

        // Gửi tới người nhận (User Subscribe: /user/{id}/queue/messages)
        messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessage.getRecipientId()), "/queue/messages", saved);
        
        // Gửi lại cho người gửi (để hiện lên UI ngay lập tức)
        messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessage.getSenderId()), "/queue/messages", saved);
    }

    // 2. API lấy lịch sử tin nhắn (HTTP)
    @GetMapping("/api/messages/{senderId}/{recipientId}")
    public ResponseEntity<List<ChatMessage>> findChatMessages(@PathVariable Long senderId, 
                                                              @PathVariable Long recipientId) {
        return ResponseEntity.ok(chatService.findChatMessages(senderId, recipientId));
    }
}