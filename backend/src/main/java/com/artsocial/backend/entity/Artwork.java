package com.artsocial.backend.entity;

import com.artsocial.backend.enums.PrivacyStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "artworks")
@Data
public class Artwork {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String caption;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    private Integer width;
    private Integer height;

    // --- THÊM MỚI ---
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "privacy_status") // Map với Enum PostgreSQL
    private PrivacyStatus privacy = PrivacyStatus.PUBLIC;

    @Column(name = "like_count")
    private Integer likeCount = 0;
    // ----------------

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}