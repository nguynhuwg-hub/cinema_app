package com.example.demo.module.booking.service;

import com.example.demo.common.exception.BadRequestException;
import com.example.demo.concession.repository.ConcessionRepository;
import com.example.demo.coupon.repository.CouponRepository;
import com.example.demo.entity.Coupon;
import com.example.demo.entity.enums.DiscountType;
import com.example.demo.module.booking.dto.BookingServicesRequest;
import com.example.demo.module.booking.entity.BookingConcession;
import com.example.demo.module.booking.enums.BookingStatus;
import com.example.demo.module.booking.repository.BookingRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BookingExtrasService {

    private final ConcessionRepository concessions;
    private final CouponRepository coupons;
    private final BookingRepository bookings;

    private static final BigDecimal MAX_AMOUNT =
            new BigDecimal("99999999.99");

    public record Quote(
            List<BookingConcession> lines,
            BigDecimal foodTotal,
            BigDecimal discount,
            Coupon coupon
    ) {}

    @Transactional
    public Quote quote(
            BookingServicesRequest request,
            Long bookingId,
            BigDecimal seatTotal,
            LocalDateTime now
    ) {
        if (request == null
                || request.getItems() == null
                || request.getItems().size() > 50) {
            throw new BadRequestException(
                    "Danh sách món không hợp lệ."
            );
        }

        // Tiền vé phải được service lấy từ dữ liệu booking,
        // không lấy từ tổng tiền do frontend gửi lên.
        seatTotal = checkedMoney(seatTotal);

        Set<Long> ids = new HashSet<>();
        List<BookingConcession> lines = new ArrayList<>();
        BigDecimal foodTotal = BigDecimal.ZERO;

        for (var item : request.getItems()) {
            if (item == null
                    || item.getConcessionId() == null
                    || item.getConcessionId() <= 0
                    || item.getQuantity() == null
                    || item.getQuantity() < 1
                    || item.getQuantity() > 99
                    || !ids.add(item.getConcessionId())) {
                throw new BadRequestException(
                        "Món hoặc số lượng không hợp lệ; không được trùng món."
                );
            }

            var concession = concessions
                    .findById(item.getConcessionId())
                    .orElseThrow(() -> new BadRequestException(
                            "Không tìm thấy món đã chọn."
                    ));

            if (!Boolean.TRUE.equals(concession.getIsActive())) {
                throw new BadRequestException(
                        "Món đã ngừng bán: " + concession.getName()
                );
            }

            BigDecimal price = checkedMoney(concession.getPrice());

            lines.add(
                    BookingConcession.builder()
                            .concession(concession)
                            .quantity(item.getQuantity())
                            .price(price)
                            .build()
            );

            foodTotal = foodTotal.add(
                    price.multiply(
                            BigDecimal.valueOf(item.getQuantity())
                    )
            );
        }

        foodTotal = checkedMoney(foodTotal);

        // Coupon được tính trên tổng tiền vé và bắp nước.
        BigDecimal orderTotal = checkedMoney(
                seatTotal.add(foodTotal)
        );

        String code = request.getCouponCode() == null
                ? ""
                : request.getCouponCode().trim();

        if (code.isEmpty()) {
            return new Quote(
                    lines,
                    foodTotal,
                    BigDecimal.ZERO,
                    null
            );
        }

        if (code.length() > 50 || orderTotal.signum() <= 0) {
            throw new BadRequestException(
                    "Mã giảm giá hoặc giá trị đơn hàng không hợp lệ."
            );
        }

        Coupon coupon = coupons.findByCodeForUpdate(code)
                .orElseThrow(() -> new BadRequestException(
                        "Mã giảm giá không tồn tại."
                ));

        if (!Boolean.TRUE.equals(coupon.getIsActive())
                || coupon.getStartDate() == null
                || coupon.getEndDate() == null
                || now.isBefore(coupon.getStartDate())
                || !now.isBefore(coupon.getEndDate())) {
            throw new BadRequestException(
                    "Mã giảm giá bị khóa, chưa đến hạn hoặc đã hết hạn."
            );
        }

        // Điều kiện đơn tối thiểu cũng tính trên toàn đơn.
        if (coupon.getMinBookingAmount() != null
                && orderTotal.compareTo(
                        coupon.getMinBookingAmount()
                ) < 0) {
            throw new BadRequestException(
                    "Tổng tiền vé và bắp nước chưa đạt mức tối thiểu của mã giảm giá."
            );
        }

        if (coupon.getUsageLimit() != null) {
            long used = coupon.getUsedCount() == null
                    ? 0
                    : coupon.getUsedCount();

            long reserved = bookings.countCouponReservations(
                    coupon.getId(),
                    bookingId,
                    BookingStatus.PENDING,
                    now
            );

            if (used + reserved >= coupon.getUsageLimit()) {
                throw new BadRequestException(
                        "Mã giảm giá đã hết lượt hoặc đang được đơn khác giữ."
                );
            }
        }

        BigDecimal value = checkedMoney(
                coupon.getDiscountValue()
        );

        BigDecimal discount;

        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            if (value.compareTo(new BigDecimal("100")) > 0) {
                throw new BadRequestException(
                        "Phần trăm giảm giá không hợp lệ."
                );
            }

            discount = orderTotal.multiply(value)
                    .divide(
                            new BigDecimal("100"),
                            2,
                            RoundingMode.HALF_UP
                    );

            if (coupon.getMaxDiscountAmount() != null) {
                discount = discount.min(
                        checkedMoney(coupon.getMaxDiscountAmount())
                );
            }
        } else if (coupon.getDiscountType()
                == DiscountType.FIXED_AMOUNT) {
            discount = value;
        } else {
            throw new BadRequestException(
                    "Loại giảm giá không hợp lệ."
            );
        }

        return new Quote(
                lines,
                foodTotal,
                discount.min(orderTotal),
                coupon
        );
    }

    public BigDecimal checkedMoney(BigDecimal amount) {
        if (amount == null
                || amount.signum() < 0
                || amount.compareTo(MAX_AMOUNT) > 0) {
            throw new BadRequestException(
                    "Số tiền không hợp lệ hoặc vượt giới hạn đơn hàng."
            );
        }

        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional
    public void recordCouponUse(Coupon coupon) {
        if (coupon == null) {
            return;
        }

        Coupon locked = coupons.findByIdForUpdate(coupon.getId())
                .orElseThrow(() -> new BadRequestException(
                        "Không tìm thấy mã giảm giá của đơn."
                ));

        int used = locked.getUsedCount() == null
                ? 0
                : locked.getUsedCount();

        locked.setUsedCount(Math.addExact(used, 1));
    }
}