package com.artsocial.backend.repository;

import com.artsocial.backend.entity.ArtworkLike;
import com.artsocial.backend.entity.ArtworkLikeId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtworkLikeRepository extends JpaRepository<ArtworkLike, ArtworkLikeId> {
    boolean existsByUserIdAndArtworkId(Long userId, Long artworkId);
}