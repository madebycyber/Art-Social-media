package com.artsocial.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    // Ánh xạ cột 'password' của Java vào cột 'password_hash' của SQL
    @Column(name = "password_hash", nullable = false) 
    private String password;

    // Hibernate xử lý enum PostgreSQL đôi khi phức tạp.
    // Để đơn giản và chạy ngay, ta map nó là String, nhưng cần insert đúng giá trị 'USER' hoặc 'ADMIN'
    // Lưu ý: Trong DB bạn set default là 'USER', nên khi insert null nó sẽ tự điền.
    @Column(insertable = false) // Để DB tự set Default giá trị khi insert mới
    private String role; 

    private String avatar;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}