
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
    private PaymentMethod paymentMethod;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_code", length = 100)
    private String transactionCode;

    @Column(name = "response_code", length = 50)
    private String responseCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // Mã tham chiếu giao dịch gửi đến VNPay.
    @Column(name = "vnp_txn_ref", length = 100)
    private String vnpTxnRef;

    // Thời gian tạo giao dịch gửi VNPay, định dạng yyyyMMddHHmmss.
    @Column(name = "vnp_create_date", length = 14)
    private String vnpCreateDate;

    // Thời gian giao dịch được VNPay ghi nhận.
    @Column(name = "vnp_transaction_date", length = 14)
    private String vnpTransactionDate;

}
