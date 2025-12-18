// AuthRequest.java
package com.artsocial.backend.dto;
import lombok.Data;

@Data
public class AuthRequest {
    private String username;
    private String password;
}