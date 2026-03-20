package com.artsocial.backend.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable; // NHỚ IMPORT DÒNG NÀY


@Entity
@Table(name = "permissions")
@Data
public class Permission {

    private static final long serialVersionUID = 1L;

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String name; // Ví dụ: ARTWORK_DELETE
    
    private String description;
}