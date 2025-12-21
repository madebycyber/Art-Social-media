package com.artsocial.backend.controller;

import com.artsocial.backend.dto.AuthRequest;
import com.artsocial.backend.dto.AuthResponse;
import com.artsocial.backend.entity.User;
import com.artsocial.backend.repository.UserRepository;
import com.artsocial.backend.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") // Cho phép Frontend gọi
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    // API Đăng nhập (Login)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
            String token = jwtUtils.generateToken(user.getUsername());
            String id = user.getId().toString();

            return ResponseEntity.ok(new AuthResponse(token, user.getUsername(), user.getRole(), id));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Sai tên đăng nhập hoặc mật khẩu!");
        }
    }

    // API Đăng ký (Register) - Dùng SQL Query
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username đã tồn tại!");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // SỬA Ở ĐÂY: Đổi "ROLE_USER" thành "USER" (để khớp với ENUM trong Database)
        String role = "USER"; 

        try {
            userRepository.addNewUser(request.getUsername(), encodedPassword, role);
            return ResponseEntity.ok("Đăng ký thành công! Hãy đăng nhập.");
        } catch (Exception e) {
            // In lỗi chi tiết ra console để dễ debug nếu còn lỗi
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi Server: " + e.getMessage());
        }
    }
}