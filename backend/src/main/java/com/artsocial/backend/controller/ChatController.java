package com.artsocial.backend.controller;

import com.artsocial.backend.entity.ChatMessage;
import com.artsocial.backend.service.ChatService;
import com.artsocial.backend.service.GeminiService;
import com.artsocial.backend.service.SystemStatsService;
import com.artsocial.backend.util.EncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Controller
public class ChatController {

    @Autowired private SimpMessagingTemplate messagingTemplate;
    @Autowired private ChatService chatService;
    @Autowired private GeminiService geminiService;
    @Autowired private SystemStatsService systemStatsService;

    private final Long BOT_ID = 9999L;

    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessage chatMessage) {
        // 1. Lưu và gửi tin nhắn gốc từ User
        ChatMessage savedUserMsg = chatService.save(chatMessage);
        // Giải mã để gửi lại frontend hiển thị ngay
        savedUserMsg.setContent(EncryptionUtil.decrypt(savedUserMsg.getContent()));

        // Gửi lại cho người gửi (để hiện lên UI của họ)
        messagingTemplate.convertAndSendToUser(
                String.valueOf(chatMessage.getSenderId()), "/queue/messages", savedUserMsg);

        // 2. LOGIC AI (RAG + Context Aware)
        if (chatMessage.getRecipientId().equals(BOT_ID)) {
            CompletableFuture.runAsync(() -> {
                try {
                    Long userId = chatMessage.getSenderId();
                    String userQuestion = savedUserMsg.getContent();

                    // A. Lấy Dữ liệu hệ thống (Knowledge Base)
                    String systemReport = systemStatsService.getFullSystemReport(userId);

                    // B. Lấy Lịch sử chat (Context Memory) 
                    // Chỉ lấy 10 tin nhắn gần nhất để tiết kiệm token và giữ ngữ cảnh nóng
                    List<ChatMessage> history = chatService.findChatMessages(userId, BOT_ID);
                    String chatHistoryContext = buildChatHistoryChunk(history, 10);

                    // C. Tạo Prompt nâng cao (Chain of Thought)
                    String finalPrompt = buildRagPrompt(systemReport, chatHistoryContext, userQuestion);

                    // D. Gọi Gemini
                    String botReplyContent = geminiService.callGemini(finalPrompt);

                    // E. Lưu và gửi phản hồi của Bot
                    ChatMessage botMsg = new ChatMessage();
                    botMsg.setSenderId(BOT_ID);
                    botMsg.setRecipientId(userId);
                    botMsg.setContent(botReplyContent);

                    ChatMessage savedBotMsg = chatService.save(botMsg);
                    savedBotMsg.setContent(EncryptionUtil.decrypt(savedBotMsg.getContent()));

                    messagingTemplate.convertAndSendToUser(
                            String.valueOf(userId), "/queue/messages", savedBotMsg);

                } catch (Exception e) {
                    e.printStackTrace();
                    sendErrorMessage(chatMessage.getSenderId(), "Hệ thống đang bận, vui lòng thử lại sau.");
                }
            });
        } else {
            // Logic chat người - người (P2P)
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(chatMessage.getRecipientId()), "/queue/messages", savedUserMsg);
        }
    }

    /**
     * Helper: Tạo chuỗi lịch sử chat để Gemini hiểu ngữ cảnh trước đó
     * (Ví dụ: User vừa hỏi về tranh A, câu sau hỏi "nó giá bao nhiêu" -> Bot sẽ hiểu "nó" là tranh A)
     */
    private String buildChatHistoryChunk(List<ChatMessage> allMessages, int limit) {
        if (allMessages == null || allMessages.isEmpty()) return "Không có lịch sử.";

        // Lấy N tin nhắn cuối cùng (Chunking by limit)
        int start = Math.max(0, allMessages.size() - limit);
        List<ChatMessage> recentMessages = allMessages.subList(start, allMessages.size());

        return recentMessages.stream()
                .map(msg -> {
                    String role = msg.getSenderId().equals(BOT_ID) ? "Bot" : "User";
                    // Lưu ý: Cần decrypt nội dung từ DB trước khi đưa vào prompt
                    String content = EncryptionUtil.decrypt(msg.getContent());
                    return role + ": " + content;
                })
                .collect(Collectors.joining("\n"));
    }

    /**
     * Helper: Xây dựng Prompt kỹ thuật (System Instruction)
     */
    private String buildRagPrompt(String systemData, String history, String currentQuestion) {
        return String.format("""
            Bạn là AI trợ lý của ArtSocial. Bạn có kiến thức tổng quan về cả mảng khác bên ngoài hệ thống, đặc biệt là về mảng design, illustration và art nói chung.
            Nếu câu hỏi về các kiến thức có trong hệ thống, hãy trả lời dựa trên thông tin sau:
            
            === PHẦN 1: DỮ LIỆU HỆ THỐNG THỰC TẾ ===
            %s
            
            === PHẦN 2: LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY ===
            (Dùng để hiểu ngữ cảnh, ví dụ: 'nó', 'người đó' là ai)
            %s
            
            === PHẦN 3: CÂU HỎI MỚI ===
            User: "%s"
            

            NHIỆM VỤ CỦA BẠN:
            1. Dùng dữ liệu Phần 1 để trả lời chính xác số liệu.
            2. Dùng Phần 2 để hiểu câu hỏi nếu nó liên quan đến câu trước.
            3. Nếu người dùng hỏi về thống kê (ví dụ: "ai hot nhất", "tranh nào đẹp nhất", "tình hình hệ thống"), hãy dùng số liệu cụ thể trong báo cáo để trả lời.
            4. Nếu người dùng hỏi xã giao bình thường (ví dụ: "chào bạn", "kể chuyện vui"), hãy trả lời thân thiện và bỏ qua số liệu thống kê.
            5. Trả lời ngắn gọn, sử dụng định dạng Markdown (in đậm **text** cho các con số hoặc tên riêng) để đẹp mắt.
            """, systemData, history, currentQuestion);
    }

    // Helper gửi lỗi về client
    private void sendErrorMessage(Long userId, String errorMsg) {
        ChatMessage errMsg = new ChatMessage();
        errMsg.setSenderId(BOT_ID);
        errMsg.setRecipientId(userId);
        errMsg.setContent(errorMsg);
        messagingTemplate.convertAndSendToUser(String.valueOf(userId), "/queue/messages", errMsg);
    }

    @GetMapping("/api/messages/{senderId}/{recipientId}")
    public ResponseEntity<List<ChatMessage>> findChatMessages(@PathVariable Long senderId, @PathVariable Long recipientId) {
        return ResponseEntity.ok(chatService.findChatMessages(senderId, recipientId));
    }
}