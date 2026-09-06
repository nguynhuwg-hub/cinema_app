package com.example.demo.auth.repository;

import com.example.demo.auth.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    // Đếm số lần đăng nhập thất bại của 1 email từ 1 IP trong khoảng thời gian nhất định (ví dụ 15 phút gần nhất)
    long countByEmailAndIpAddressAndSuccessFalseAndAttemptedAtAfter(String email, String ipAddress, LocalDateTime since);
}
