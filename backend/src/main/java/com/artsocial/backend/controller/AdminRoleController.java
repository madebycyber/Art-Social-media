package com.artsocial.backend.controller;

import com.artsocial.backend.entity.*;
import com.artsocial.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/roles")
public class AdminRoleController {

    @Autowired private RoleRepository roleRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private UserRepository userRepository;

    // --- SỬA Ở ĐÂY ---
    // Cho phép cả người có quyền ROLE_MANAGE HOẶC USER_MANAGE đều xem được danh sách Role
    // (Để User Manager có thể load dữ liệu vào dropdown)
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_MANAGE') or hasAuthority('USER_MANAGE')")
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    // Các hàm Tạo/Sửa/Xóa Role thì vẫn giữ chặt, chỉ ROLE_MANAGE mới được làm
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public Role createRole(@RequestBody Role roleData) {
        if (roleRepository.findByName(roleData.getName()).isPresent()) {
            throw new RuntimeException("Role này đã tồn tại");
        }
        if (roleData.getName().equalsIgnoreCase("ADMIN")) {
            throw new RuntimeException("Không thể tạo Role Admin qua API");
        }
        return roleRepository.save(roleData);
    }
    
    // API lấy Permissions
    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    // --- SỬA HÀM NÀY ---
    @PostMapping("/{roleId}/permissions")
    @PreAuthorize("hasAuthority('ROLE_MANAGE')")
    public Role assignPermissions(@PathVariable Long roleId, @RequestBody List<Long> permissionIds) {
        Role role = roleRepository.findById(roleId).orElseThrow();
        
        if (role.getName().equalsIgnoreCase("ADMIN")) {
            throw new RuntimeException("Role ADMIN được quản lý cứng bởi hệ thống");
        }

        List<Permission> permissions = permissionRepository.findAllById(permissionIds);
        
        // --- SỬA LỖI TẠI ĐÂY ---
        // SAI: role.setPermissions(Set.copyOf(permissions)); -> Gây lỗi Immutable
        
        // ĐÚNG: Tạo HashSet mới có thể chỉnh sửa
        role.setPermissions(new HashSet<>(permissions)); 
        
        return roleRepository.save(role);
    }
}