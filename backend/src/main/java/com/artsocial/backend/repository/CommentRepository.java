package com.artsocial.backend.repository;

import com.artsocial.backend.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Lấy tất cả comment của 1 tranh, sắp xếp mới nhất trước
    // Dùng JOIN FETCH user để tránh N+1 query
    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.artwork.id = :artworkId ORDER BY c.createdAt DESC")
    List<Comment> findByArtworkId(Long artworkId);
}