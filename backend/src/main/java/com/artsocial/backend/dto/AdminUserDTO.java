package com.artsocial.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminUserDTO {
    private Long id;
    private String username;
    private String roleName; // Thay vì trả về object Role, chỉ trả về tên
    private Long roleId;     // Để dùng cho việc sửa Role
}