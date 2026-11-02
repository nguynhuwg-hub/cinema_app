package com.example.demo.coupon.controller;

import com.example.demo.entity.Coupon;
import com.example.demo.coupon.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coupons")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @GetMapping("/manage/list")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponService.getAllCouponsForStaff());
    }

    @PostMapping("/manage/save")
    public ResponseEntity<Coupon> saveCoupon(@RequestBody Coupon coupon) {
        return ResponseEntity.ok(couponService.saveOrUpdateCoupon(coupon));
    }

    // Sửa lại nhận dữ liệu qua RequestBody dạng JSON để an toàn tuyệt đối
    @PostMapping("/validate")
    public ResponseEntity<BigDecimal> validateAndApplyCoupon(@RequestBody Map<String, Object> requestData) {
        String code = (String) requestData.get("code");
        // Chuyển đổi an toàn sang BigDecimal cho totalAmount
        BigDecimal totalAmount = new BigDecimal(requestData.get("totalAmount").toString());
        
        BigDecimal discount = couponService.validateAndApplyCoupon(code, totalAmount);
        return ResponseEntity.ok(discount);
    }
}