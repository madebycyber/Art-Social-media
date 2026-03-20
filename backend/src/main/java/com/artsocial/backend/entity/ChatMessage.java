package com.artsocial.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import java.io.Serializable; // NHỚ IMPORT DÒNG NÀY


@Entity
@Table(name = "chat_messages")
@Data
public class ChatMessage {

    private static final long serialVersionUID = 1L;


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "chat_id")
    private String chatId;
    
    @Column(name = "sender_id")
    private Long senderId;
    
    @Column(name = "recipient_id")
    private Long recipientId;
    
    private String content; // Lưu dạng mã hóa
    
    @Column(name = "created_at")
    private Date createdAt;
}