package com.artsocial.backend.controller;

import com.artsocial.backend.dto.AuthRequest;
import com.artsocial.backend.dto.AuthResponse;
import com.artsocial.backend.entity.Role;
import com.artsocial.backend.entity.User;
import com.artsocial.backend.repository.RoleRepository; // Cần import thêm
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
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository; // Inject RoleRepository
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtils jwtUtils;

    // API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
            String token = jwtUtils.generateToken(user.getUsername());
            String id = user.getId().toString();

            // SỬA: Lấy tên role từ Object Role
            return ResponseEntity.ok(new AuthResponse(token, user.getUsername(), user.getRole().getName(), id));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Sai tên đăng nhập hoặc mật khẩu!");
        }
    }

    // API Đăng ký
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username đã tồn tại!");
        }

        // --- LOGIC MỚI ---
        try {
            User newUser = new User();
            newUser.setUsername(request.getUsername());
            newUser.setPassword(passwordEncoder.encode(request.getPassword())); // Check lại tên setter là setPassword hay setPasswordHash

            // 1. Tìm Role mặc định là "USER" trong DB
            Role userRole = roleRepository.findByName("USER")
                    .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Role USER chưa được khởi tạo."));
            
            // 2. Gán Role object vào User
            newUser.setRole(userRole);

            // 3. Lưu bằng JPA (save) thay vì query SQL thủ công để Hibernate tự map khóa ngoại
            userRepository.save(newUser);

            return ResponseEntity.ok("Đăng ký thành công! Hãy đăng nhập.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi Server: " + e.getMessage());
        }
    }
}