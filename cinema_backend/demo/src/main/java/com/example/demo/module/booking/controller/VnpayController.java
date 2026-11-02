package com.example.demo.module.booking.controller;

import com.example.demo.module.booking.service.BookingService;
import com.example.demo.module.booking.service.VnpayQueryService;
import com.example.demo.module.booking.service.VnpayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments/vnpay")
@RequiredArgsConstructor
public class VnpayController {

    private final VnpayService vnpay;
    private final VnpayQueryService vnpayQuery;
    private final BookingService bookings;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    // Tạo URL thanh toán cho đơn thuộc người đang đăng nhập.
    @PostMapping("/{bookingId}/url")
    public Map<String, String> paymentUrl(
            @PathVariable Long bookingId,
            Authentication authentication,
            HttpServletRequest request
    ) {
        String email = requireEmail(authentication);

        return vnpay.paymentUrl(
                bookingId,
                email,
                request.getRemoteAddr()
        );
    }

    // Nhận thông báo giao dịch từ VNPay.
    @GetMapping("/ipn")
    public Map<String, String> ipn(
            @RequestParam Map<String, String> params
    ) {
        return vnpay.ipn(params);
    }

    // Nhận kết quả khi trình duyệt quay về từ VNPay.
    @GetMapping("/return")
    public ResponseEntity<Void> browserReturn(
            @RequestParam Map<String, String> params
    ) {
        // Luôn xác minh chữ ký và mã merchant trước khi chuyển hướng.
        Long bookingId = vnpay.verifiedBookingId(params);

        boolean sandboxReturn = vnpay.isSandboxReturnEnabled();

        if (sandboxReturn) {
            // Xác nhận qua cùng xử lý thanh toán với IPN.
            vnpay.confirmSandboxReturn(params);
        }

        String destination =
                frontendUrl.replaceAll("/+$", "")
                        + "/checkout/"
                        + bookingId
                        + (sandboxReturn
                                ? "?vnpay=sandbox-return"
                                : "?vnpay=returned");

        // Checkout đọc trạng thái từ backend.
        // Chỉ khi PAID mới chuyển khách sang trang vé.
        return ResponseEntity
                .status(HttpStatus.SEE_OTHER)
                .location(URI.create(destination))
                .build();
    }

    // Chủ động truy vấn trạng thái giao dịch qua VNPay QueryDr.
    @PostMapping("/{bookingId}/verify")
    public Map<String, String> verifyPayment(
            @PathVariable Long bookingId,
            Authentication authentication,
            HttpServletRequest request
    ) {
        String email = requireEmail(authentication);

        // Kiểm tra quyền sở hữu đơn trước khi truy vấn.
        bookings.getBookingById(bookingId, email);

        return vnpayQuery.queryPayment(
                bookingId,
                request.getRemoteAddr()
        );
    }

    private String requireEmail(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(
                        authentication.getPrincipal()
                )) {
            throw new AccessDeniedException(
                    "Bạn cần đăng nhập để thực hiện thao tác này."
            );
        }

        return authentication.getName();
    }
}