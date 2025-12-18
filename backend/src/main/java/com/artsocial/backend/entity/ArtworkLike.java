package com.artsocial.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "artwork_likes")
@Data
@NoArgsConstructor
@IdClass(ArtworkLikeId.class) // Cần tạo thêm class Composite Key bên dưới
public class ArtworkLike {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "artwork_id")
    private Long artworkId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public ArtworkLike(Long userId, Long artworkId) {
        this.userId = userId;
        this.artworkId = artworkId;
    }
}