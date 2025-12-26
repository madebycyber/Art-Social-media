package com.artsocial.backend.security;

import com.artsocial.backend.entity.Permission;
import com.artsocial.backend.entity.User;
import com.artsocial.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Tìm user trong DB
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // --- LOGIC MỚI: TẠO DANH SÁCH QUYỀN HẠN ---
        List<GrantedAuthority> authorities = new ArrayList<>();

        // 1. Thêm Role chính (Spring Security thường dùng prefix ROLE_)
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));

        // 2. Thêm tất cả Permission cụ thể (Ví dụ: ARTWORK_DELETE)
        for (Permission p : user.getRole().getPermissions()) {
            authorities.add(new SimpleGrantedAuthority(p.getName()));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(), // Lưu ý: Entity của bạn là passwordHash hay password? Hãy check lại getter
                authorities
        );
    }
}