package com.artsocial.backend.entity;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.io.Serializable; // NHỚ IMPORT DÒNG NÀY

import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class FollowId implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long followerId;
    private Long followingId;
}