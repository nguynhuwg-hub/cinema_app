package com.example.demo.coupon.service;

import com.example.demo.entity.Coupon;
import com.example.demo.entity.enums.DiscountType;
import com.example.demo.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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
        Optional<Coupon> optionalCoupon = couponRepository.findByCodeAndIsActiveTrue(code);

        if (optionalCoupon.isEmpty()) {
            throw new RuntimeException("Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa!");
        }

        Coupon coupon = optionalCoupon.get();

        // Kiểm tra điều kiện giá trị đơn hàng tối thiểu (dùng minBookingAmount từ Coupon.java)
        if (coupon.getMinBookingAmount() != null && totalAmount.compareTo(coupon.getMinBookingAmount()) < 0) {
            throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã này (" + coupon.getMinBookingAmount() + ")");
        }

        // Tính toán số tiền được giảm
        BigDecimal discountAmount = BigDecimal.ZERO;
        
        // Chuyển Enum sang String để so sánh an toàn, tránh lỗi lệch tên hằng số
        String discountTypeStr = coupon.getDiscountType() != null ? coupon.getDiscountType().name() : "";

        if ("PERCENTAGE".equalsIgnoreCase(discountTypeStr)) {
            // Giảm theo % (Ví dụ: discountValue = 10 nghĩa là giảm 10%)
            discountAmount = totalAmount.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
            
            // Nếu có giới hạn số tiền giảm tối đa (maxDiscountAmount)
            if (coupon.getMaxDiscountAmount() != null && discountAmount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discountAmount = coupon.getMaxDiscountAmount();
            }
        } else if ("FIXED".equalsIgnoreCase(discountTypeStr) || "CASH".equalsIgnoreCase(discountTypeStr)) {
            // Giảm theo số tiền cố định
            discountAmount = coupon.getDiscountValue();
        }
        // Đảm bảo số tiền giảm không vượt quá tổng tiền đơn hàng
        if (discountAmount.compareTo(totalAmount) > 0) {
            discountAmount = totalAmount;
        }

        return discountAmount;
    }
}