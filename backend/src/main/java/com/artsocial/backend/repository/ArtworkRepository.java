package com.artsocial.backend.repository;

import com.artsocial.backend.entity.Artwork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import org.springframework.data.repository.query.Param;

public interface ArtworkRepository extends JpaRepository<Artwork, Long> {

    // CHỈ LẤY TRANH PUBLIC CHO TRANG CHỦ
    @Query("SELECT a FROM Artwork a JOIN FETCH a.user WHERE a.privacy = 'PUBLIC' ORDER BY a.createdAt DESC")
    List<Artwork> findAllPublicArtworks();

    // Lấy tranh theo User (Cần xử lý logic xem ai đang request để filter sau)
    List<Artwork> findByUserId(Long userId);

    // Tìm các tranh mà user có ID cụ thể đã Like
    @Query("SELECT a FROM Artwork a JOIN ArtworkLike al ON a.id = al.artworkId WHERE al.userId = :userId")
    List<Artwork> findLikedArtworksByUserId(@Param("userId") Long userId);
    
    // Lấy danh sách ID tranh mà user đã like (để tô đỏ trái tim ở Home)
    @Query("SELECT al.artworkId FROM ArtworkLike al WHERE al.userId = :userId")
    List<Long> findLikedArtworkIdsByUserId(@Param("userId") Long userId);

    List<Artwork> findTop5ByOrderByLikeCountDesc();

    List<Artwork> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Đếm tổng số tranh
    long count();

    // Tính tổng lượng Like toàn hệ thống (Dùng COALESCE để tránh null)
    @Query(value = "SELECT COALESCE(SUM(like_count), 0) FROM artworks", nativeQuery = true)
    Long sumTotalLikes();
}