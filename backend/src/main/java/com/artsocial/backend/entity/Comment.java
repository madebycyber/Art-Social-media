package com.artsocial.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;


@Entity
@Table(name = "comments")
@Data
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "upvote_count")
    private Integer upvoteCount = 0;

    @Column(name = "downvote_count")
    private Integer downvoteCount = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artwork_id", nullable = false)
    private Artwork artwork;

    // Tự tham chiếu để làm bình luận đa cấp (Cha - Con)
    @ManyToOne
    @JoinColumn(name = "parent_id")
    private Comment parent;

    // Transient: Trường này không lưu trong DB comments, dùng để gửi xuống Frontend cho dễ hiển thị
    @Transient
    private int userVoteType = 0; // 0: chưa vote, 1: up, -1: down
}