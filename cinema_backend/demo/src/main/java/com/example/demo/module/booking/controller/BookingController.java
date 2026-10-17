package com.example.demo.module.booking.controller;

import com.example.demo.module.booking.dto.BookingRequest;
import com.example.demo.module.booking.dto.BookingResponse;
import com.example.demo.module.booking.service.BookingService;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAuthority('BOOKING_CREATE')")
    public ResponseEntity<BookingResponse> createBooking(
            @RequestBody BookingRequest request,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        // Không cho client tạo đơn dưới danh nghĩa người khác.
        request.setUserId(user.getId());

        return ResponseEntity.ok(
                bookingService.createBooking(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("""
        hasAnyAuthority('BOOKING_READ_OWN', 'BOOKING_READ_ANY')
        """)
    public ResponseEntity<BookingResponse> getBookingById(
            @PathVariable Long id,
            Authentication authentication) {

        BookingResponse booking = bookingService.getBookingById(id);

        boolean canReadAny = authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        "BOOKING_READ_ANY".equals(authority.getAuthority()));

        if (!canReadAny) {
            User user = getCurrentUser(authentication);

            if (!Objects.equals(booking.getUserId(), user.getId())) {
                throw new AccessDeniedException(
                        "Bạn chỉ được xem đơn đặt vé của mình");
            }
        }

        return ResponseEntity.ok(booking);
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException(
                        "Không tìm thấy tài khoản đăng nhập"));
    }
}