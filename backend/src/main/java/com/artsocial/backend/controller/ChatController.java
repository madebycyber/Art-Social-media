package com.artsocial.backend.controller;

import com.artsocial.backend.entity.ChatMessage;
import com.artsocial.backend.service.ChatService;
import com.artsocial.backend.service.GeminiService; // Import mới
import com.artsocial.backend.util.EncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.artsocial.backend.service.SystemStatsService;

import java.util.List;
import java.util.concurrent.CompletableFuture; // Import mới

@Controller
public class ChatController {

    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private ChatService chatService;
    @Autowired private GeminiService geminiService; // Inject Service
    @Autowired private SystemStatsService systemStatsService;

    private final Long BOT_ID = 9999L; // ID cố định của Bot

@MessageMapping("/chat")
    public void processMessage(@Payload ChatMessage chatMessage) {
        // 1. Lưu và gửi tin nhắn gốc (Giữ nguyên code cũ)
        ChatMessage savedUserMsg = chatService.save(chatMessage);
        savedUserMsg.setContent(EncryptionUtil.decrypt(savedUserMsg.getContent()));

        messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessage.getSenderId()), "/queue/messages", savedUserMsg);

        if (!chatMessage.getRecipientId().equals(BOT_ID)) {
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(chatMessage.getRecipientId()), "/queue/messages", savedUserMsg);
        }

        // 2. LOGIC AI THÔNG MINH
        if (chatMessage.getRecipientId().equals(BOT_ID)) {
            CompletableFuture.runAsync(() -> {
                try {
                    String userQuestion = savedUserMsg.getContent();

                    // A. Luôn lấy toàn bộ dữ liệu hệ thống (Data Injection)
                    String systemReport = systemStatsService.getFullSystemReport(chatMessage.getSenderId());

                    // B. Tạo Prompt kỹ thuật (System Instruction)
                    // Hướng dẫn AI đóng vai trò Admin và cách sử dụng dữ liệu
                    String finalPrompt = String.format("""
                        Bạn là AI trợ lý ảo của mạng xã hội ArtSocial.
                        Dưới đây là DỮ LIỆU THỰC TẾ hiện tại của hệ thống:
                        
                        %s
                        
                        NHIỆM VỤ CỦA BẠN:
                        1. Trả lời câu hỏi của người dùng dựa trên dữ liệu trên.
                        2. Nếu người dùng hỏi về thống kê (ví dụ: "ai hot nhất", "tranh nào đẹp nhất", "tình hình hệ thống"), hãy dùng số liệu cụ thể trong báo cáo để trả lời.
                        3. Nếu người dùng hỏi xã giao bình thường (ví dụ: "chào bạn", "kể chuyện vui"), hãy trả lời thân thiện và bỏ qua số liệu thống kê.
                        4. Trả lời ngắn gọn, sử dụng định dạng Markdown (in đậm **text** cho các con số hoặc tên riêng) để đẹp mắt.
                        
                        Câu hỏi của người dùng: "%s"
                        """, systemReport, userQuestion);

                    // C. Gọi Gemini
                    String botReplyContent = geminiService.callGemini(finalPrompt);

                    // D. Lưu và gửi phản hồi (Giữ nguyên code cũ)
                    ChatMessage botMsg = new ChatMessage();
                    botMsg.setSenderId(BOT_ID);
                    botMsg.setRecipientId(chatMessage.getSenderId());
                    botMsg.setContent(botReplyContent);

                    ChatMessage savedBotMsg = chatService.save(botMsg);
                    savedBotMsg.setContent(EncryptionUtil.decrypt(savedBotMsg.getContent()));

                    messagingTemplate.convertAndSendToUser(
                            String.valueOf(chatMessage.getSenderId()), "/queue/messages", savedBotMsg);

                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }

    // API lấy lịch sử chat (Giữ nguyên)
    @GetMapping("/api/messages/{senderId}/{recipientId}")
    public ResponseEntity<List<ChatMessage>> findChatMessages(@PathVariable Long senderId, @PathVariable Long recipientId) {
        return ResponseEntity.ok(chatService.findChatMessages(senderId, recipientId));
    }
}