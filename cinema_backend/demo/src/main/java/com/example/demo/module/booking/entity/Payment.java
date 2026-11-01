package com.example.demo.module.booking.entity;

import com.example.demo.entity.enums.PaymentMethod;
import com.example.demo.entity.enums.PaymentStatus;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod; // MOMO, VNPAY, ZALOPAY, CASH

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount; // Số tiền thực tế thanh toán qua cổng

    @Column(name = "transaction_code", length = 100)
    private String transactionCode; // Mã giao dịch do VNPAY/MoMo cấp (dùng đối soát)

    @Column(name = "response_code", length = 50)
    private String responseCode; // Mã phản hồi lỗi hoặc thành công từ cổng thanh toán (ví dụ: "00")

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus; // PENDING, SUCCESS, FAILED

    @Column(name = "paid_at")
    private LocalDateTime paidAt; // Thời điểm giao dịch thành công thực tế
}
