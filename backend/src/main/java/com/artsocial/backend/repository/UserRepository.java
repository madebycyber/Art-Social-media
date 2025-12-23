package com.artsocial.backend.repository;

import com.artsocial.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);

    @Modifying
    @Transactional
    // SỬA LỖI Ở ĐÂY: Đổi 'password' thành 'password_hash'
    // Đổi logic Role: Vì DB dùng ENUM('USER', 'ADMIN') nên cần ép kiểu
    @Query(value = "INSERT INTO users (username, password_hash, role) VALUES (?1, ?2, ?3\\:\\:user_role)", nativeQuery = true)
    void addNewUser(String username, String password, String role);

    // 1. Đếm tổng User
    long count();

    // 2. Top 5 User có nhiều follower nhất
    // (Logic: Join bảng follows, group by following_id, đếm số lượng)
    @Query(value = "SELECT u.* FROM users u JOIN follows f ON u.id = f.following_id GROUP BY u.id ORDER BY COUNT(f.follower_id) DESC LIMIT 5", nativeQuery = true)
    List<User> findTop5MostFollowed();

    // Tìm 3 user mới tham gia nhất
    @Query(value = "SELECT * FROM users ORDER BY created_at DESC LIMIT 3", nativeQuery = true)
    List<User> findTop3NewestUsers();
}