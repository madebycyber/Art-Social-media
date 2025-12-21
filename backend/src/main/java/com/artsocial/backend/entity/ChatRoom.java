package com.artsocial.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Entity
@Table(name = "chat_rooms")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_id")
    private String chatId;

    @Column(name = "sender_id")
    private Long senderId;

    @Column(name = "recipient_id")
    private Long recipientId;

    // --- CÁC TRƯỜNG BẮT BUỘC PHẢI CÓ ---
    @Column(name = "last_message", columnDefinition = "TEXT")
    private String lastMessage;

    @Column(name = "last_message_at")
    private Date lastMessageAt;

    @Builder.Default
    @Column(name = "unread_count")
    private Integer unreadCount = 0;
}