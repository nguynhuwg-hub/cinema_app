package com.example.demo.coupon.controller;

import com.example.demo.entity.Coupon;
import com.example.demo.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    // API cho Nhân viên: Lấy danh sách mã giảm giá (gọi đúng hàm getAllCouponsForStaff của Service)
    @GetMapping("/manage/list")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponService.getAllCouponsForStaff());
    }

    // API cho Nhân viên: Thêm hoặc cập nhật mã giảm giá (gọi đúng hàm saveOrUpdateCoupon của Service)
    @PostMapping("/manage/save")
    public ResponseEntity<Coupon> saveCoupon(@RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponService.saveOrUpdateCoupon(coupon));
    }

    // API cho Khách hàng: Kiểm tra và áp dụng mã giảm giá
    @PostMapping("/validate")
    public ResponseEntity<BigDecimal> validateAndApplyCoupon(
            @RequestParam String code, 
            @RequestParam BigDecimal totalAmount) {
        BigDecimal discount = couponService.validateAndApplyCoupon(code, totalAmount);
        return ResponseEntity.ok(discount);
    }
}