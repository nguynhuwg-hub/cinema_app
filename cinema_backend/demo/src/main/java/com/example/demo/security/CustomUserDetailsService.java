package com.example.demo.security;

import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "Không tìm thấy người dùng với email: " + email
                        )
                );

        // Tập hợp tất cả quyền của User
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();

        // ==========================================
        // 1. Thêm ROLE vào GrantedAuthority
        // ==========================================
        user.getRoles().forEach(role -> {

            authorities.add(
                    new SimpleGrantedAuthority(
                            role.getName().name()
                    )
            );

            // ==========================================
            // 2. Thêm Permission của Role
            // ==========================================
            role.getPermissions().forEach(permission -> {

                authorities.add(
                        new SimpleGrantedAuthority(
                                permission.getCode()
                        )
                );

            });
        });

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                authorities
        );
    }
}