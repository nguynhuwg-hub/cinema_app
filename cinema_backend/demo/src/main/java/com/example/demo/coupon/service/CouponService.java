package com.example.demo.coupon.service;

import com.example.demo.entity.Coupon;
import com.example.demo.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    // 1. Lấy danh sách toàn bộ mã giảm giá cho nhân viên quản lý
    public List<Coupon> getAllCouponsForStaff() {
        return couponRepository.findAll();
    }

    // 2. Thêm mới hoặc cập nhật mã giảm giá
    public Coupon saveOrUpdateCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }

    // 3. Kiểm tra và áp dụng mã giảm giá dựa trên mã code và tổng tiền đơn hàng
    public BigDecimal validateAndApplyCoupon(String code, BigDecimal totalAmount) {
        if (code == null || code.trim().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập mã giảm giá!");
        }

        // Tìm theo code (không phân biệt hoa thường hoặc tìm kiếm trực tiếp)
        Optional<Coupon> optionalCoupon = couponRepository.findByCodeIgnoreCase(code.trim());

        if (optionalCoupon.isEmpty()) {
            throw new RuntimeException("Mã giảm giá không tồn tại!");
        }

        Coupon coupon = optionalCoupon.get();

        // Kiểm tra trạng thái isActive (Hỗ trợ cả trường hợp field bị null)
        Boolean isActive = coupon.getIsActive() != null ? coupon.getIsActive() : true;
        if (!isActive) {
            throw new RuntimeException("Mã giảm giá này đã bị khóa!");
        }

        // Kiểm tra thời hạn mã giảm giá (StartDate và EndDate)
        LocalDateTime now = LocalDateTime.now();
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            throw new RuntimeException("Mã giảm giá chưa đến hạn sử dụng!");
        }
        if (coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            throw new RuntimeException("Mã giảm giá đã hết hạn sử dụng!");
        }

        // Kiểm tra điều kiện giá trị đơn hàng tối thiểu
        if (coupon.getMinBookingAmount() != null && totalAmount.compareTo(coupon.getMinBookingAmount()) < 0) {
            throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu " + coupon.getMinBookingAmount() + " VNĐ!");
        }

        // Tính toán số tiền được giảm
        BigDecimal discountAmount = BigDecimal.ZERO;
        
        // Chuẩn hóa chuỗi loại giảm giá để bắt mọi trường hợp (FIXED_AMOUNT, FIXED, CASH, PERCENTAGE)
        String discountTypeStr = "";
        if (coupon.getDiscountType() != null) {
            discountTypeStr = coupon.getDiscountType().toString().trim();
        }

        if ("PERCENTAGE".equalsIgnoreCase(discountTypeStr)) {
            // Giảm theo %
            if (coupon.getDiscountValue() != null) {
                discountAmount = totalAmount.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
            }
            if (coupon.getMaxDiscountAmount() != null && discountAmount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discountAmount = coupon.getMaxDiscountAmount();
            }
        } else {
            // Mặc định các loại còn lại (FIXED_AMOUNT, FIXED, CASH hoặc null) là giảm tiền mặt trực tiếp
            if (coupon.getDiscountValue() != null) {
                discountAmount = coupon.getDiscountValue();
            }
        }
        
        // Đảm bảo số tiền giảm không vượt quá tổng tiền đơn hàng
        if (discountAmount.compareTo(totalAmount) > 0) {
            discountAmount = totalAmount;
        }

        return discountAmount;
    }
}