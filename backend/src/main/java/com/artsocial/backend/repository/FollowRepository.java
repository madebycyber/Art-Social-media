package com.artsocial.backend.repository;

import com.artsocial.backend.entity.Follow;
import com.artsocial.backend.entity.FollowId;
import com.artsocial.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, FollowId> {
    
    // 1. Lấy danh sách ID những người MÌNH đang theo dõi (để Frontend check trạng thái)
    @Query("SELECT f.followingId FROM Follow f WHERE f.followerId = :myId")
    List<Long> findFollowingIdsByUserId(Long myId);

    // 2. Lấy danh sách User chi tiết mà MÌNH đang theo dõi (Sidebar: Đang theo dõi)
    // Join bảng Users với bảng Follows dựa trên following_id
    @Query("SELECT u FROM User u JOIN Follow f ON u.id = f.followingId WHERE f.followerId = :myId")
    List<User> findFollowingByUserId(Long myId);

    // 3. Lấy danh sách User chi tiết đang theo dõi MÌNH (Sidebar: Người theo dõi)
    // Join bảng Users với bảng Follows dựa trên follower_id
    @Query("SELECT u FROM User u JOIN Follow f ON u.id = f.followerId WHERE f.followingId = :myId")
    List<User> findFollowersByUserId(Long myId);
}