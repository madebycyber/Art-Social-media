package com.artsocial.backend.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.io.Serializable; // NHỚ IMPORT DÒNG NÀY


@Entity
@Table(name = "roles")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"}) // Bỏ qua list users nếu có
public class Role {

    private static final long serialVersionUID = 1L;

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name; // Ví dụ: ADMIN, MODERATOR
    
    private String description;

    @ManyToMany(fetch = FetchType.EAGER) // Load quyền ngay lập tức khi load Role
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();
}