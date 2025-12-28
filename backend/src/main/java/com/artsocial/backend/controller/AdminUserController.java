package com.artsocial.backend.controller;

import com.artsocial.backend.dto.AdminUserDTO;
import com.artsocial.backend.entity.Role;
import com.artsocial.backend.entity.User;
import com.artsocial.backend.repository.RoleRepository;
import com.artsocial.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
// BẮT BUỘC: User đăng nhập phải có quyền 'USER_MANAGE' trong bảng permissions
@PreAuthorize("hasAuthority('USER_MANAGE')") 
public class AdminUserController {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // 1. Lấy danh sách Users (Map sang DTO để tránh lỗi lặp vô tận)
    @GetMapping
    public List<AdminUserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(user -> new AdminUserDTO(
                user.getId(),
                user.getUsername(),
                user.getRole().getName(), // Lấy tên Role
                user.getRole().getId()    // Lấy ID Role
            ))
            .collect(Collectors.toList());
    }

    // 2. Tạo User mới
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> payload) {
        String username = (String) payload.get("username");
        String password = (String) payload.get("password");
        
        // Fix lỗi parse: JSON trả về Integer, cần ép kiểu an toàn
        Long roleId = Long.valueOf(payload.get("roleId").toString());

        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body("Username đã tồn tại");
        }

        User user = new User();
        user.setUsername(username);
        
        // SỬA: Dùng setPassword (khớp với Entity User bạn cung cấp)
        user.setPassword(passwordEncoder.encode(password)); 
        
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role không tồn tại"));
        user.setRole(role);

        userRepository.save(user);
        return ResponseEntity.ok("Tạo thành công");
    }

    // 3. Cập nhật User
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // Bảo vệ tài khoản Super Admin (tránh Admin tự xóa quyền của mình)
        // Check kỹ cả tên Role và Username
        if ("ADMIN".equalsIgnoreCase(user.getRole().getName()) && "admin".equalsIgnoreCase(user.getUsername())) { 
             return ResponseEntity.badRequest().body("Không thể chỉnh sửa Super Admin");
        }

        // Cập nhật Role
        if (payload.containsKey("roleId")) {
            Long roleId = Long.valueOf(payload.get("roleId").toString());
            Role role = roleRepository.findById(roleId)
                    .orElseThrow(() -> new RuntimeException("Role không tồn tại"));
            user.setRole(role);
        }

        // Cập nhật Password (nếu có nhập)
        if (payload.containsKey("password")) {
            String newPass = (String) payload.get("password");
            if (newPass != null && !newPass.isEmpty()) {
                // SỬA: Dùng setPassword
                user.setPassword(passwordEncoder.encode(newPass));
            }
        }

        userRepository.save(user);
        return ResponseEntity.ok("Cập nhật thành công");
    }

    // 4. Xóa User
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        
        if ("ADMIN".equalsIgnoreCase(user.getRole().getName())) {
            return ResponseEntity.status(403).body("Không thể xóa tài khoản Admin");
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok("Đã xóa user");
    }
}