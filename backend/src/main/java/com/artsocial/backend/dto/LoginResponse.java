package com.artsocial.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private Long id;        // Quan trọng: Phải có ID
    private String username;
    private String email;
}