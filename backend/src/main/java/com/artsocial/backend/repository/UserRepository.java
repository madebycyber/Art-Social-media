package com.artsocial.backend.repository;

import com.artsocial.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);

    @Modifying
    @Transactional
    // SỬA LỖI Ở ĐÂY: Đổi 'password' thành 'password_hash'
    // Đổi logic Role: Vì DB dùng ENUM('USER', 'ADMIN') nên cần ép kiểu
    @Query(value = "INSERT INTO users (username, password_hash, role) VALUES (?1, ?2, ?3\\:\\:user_role)", nativeQuery = true)
    void addNewUser(String username, String password, String role);
}