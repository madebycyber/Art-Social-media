package com.artsocial.backend.dto;

import lombok.Data;

@Data
public class CommentRequest {
    private Long artworkId;
    private String content;
    private Long parentId;
}