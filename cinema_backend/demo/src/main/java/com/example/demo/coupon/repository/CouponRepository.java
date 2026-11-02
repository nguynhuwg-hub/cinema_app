package com.example.demo.coupon.repository;

import com.example.demo.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    
    // Tìm mã giảm giá theo mã code và đang active
    Optional<Coupon> findByCodeAndIsActiveTrue(String code);

    // Bổ sung hàm tìm kiếm không phân biệt hoa thường để Service sử dụng
    Optional<Coupon> findByCodeIgnoreCase(String code);
}