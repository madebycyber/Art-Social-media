package com.artsocial.backend.repository;

import com.artsocial.backend.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByChatIdOrderByCreatedAtAsc(String chatId);
}