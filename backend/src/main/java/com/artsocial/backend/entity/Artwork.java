package com.artsocial.backend.entity;

import com.artsocial.backend.enums.PrivacyStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import java.io.Serializable; // NHỚ IMPORT DÒNG NÀY
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "artworks")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Artwork {
    
    private static final long serialVersionUID = 1L;

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