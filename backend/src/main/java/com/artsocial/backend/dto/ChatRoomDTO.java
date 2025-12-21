package com.artsocial.backend.dto;

import lombok.Data;
import java.util.Date;

@Data
public class ChatRoomDTO {
    private Long roomId;
    private Long recipientId;
    private String recipientName;
    private String recipientAvatar;
    private String lastMessage;
    private Date lastMessageAt;
    private Integer unreadCount;
}