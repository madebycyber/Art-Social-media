package com.artsocial.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.io.Serializable; // NHỚ IMPORT DÒNG NÀY


@Entity
@Table(name = "follows") // Tên bảng phải khớp với SQL bạn tạo
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(FollowId.class) // Khóa chính phức hợp
public class Follow {

    private static final long serialVersionUID = 1L;


    @Id
    @Column(name = "follower_id")
    private Long followerId;

    @Id
    @Column(name = "following_id") // Khớp với SQL của bạn
    private Long followingId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Follow(Long followerId, Long followingId) {
        this.followerId = followerId;
        this.followingId = followingId;
    }
}