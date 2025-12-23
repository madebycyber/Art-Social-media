package com.artsocial.backend.repository;

import com.artsocial.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatIdOrderByCreatedAtAsc(String chatId);

    // Top 3 người mà User (senderId) nhắn tin nhiều nhất
    // Trả về List các mảng Object[] gồm: [recipient_id, count]
    @Query(value = "SELECT recipient_id, COUNT(*) as cnt FROM chat_messages WHERE sender_id = ?1 GROUP BY recipient_id ORDER BY cnt DESC LIMIT 3", nativeQuery = true)
    List<Object[]> findTopChatPartners(Long senderId);
}