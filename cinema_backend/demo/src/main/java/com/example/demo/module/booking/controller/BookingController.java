
package com.example.demo.module.booking.controller;

import com.example.demo.module.booking.dto.BookingRequest;
import com.example.demo.module.booking.dto.BookingResponse;
import com.example.demo.module.booking.service.BookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // 1. Tạo đơn đặt vé
    @PostMapping
    @PreAuthorize("hasAuthority('BOOKING_CREATE')")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            Authentication authentication
    ) {
        BookingResponse response = bookingService.createBooking(
                request,
                authentication.getName()
        );

        return ResponseEntity.status(201).body(response);
    }

    // 2. Xem danh sách đơn của bản thân
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('BOOKING_READ_OWN')")
    public List<BookingResponse> getMyBookings(
            Authentication authentication
    ) {
        return bookingService.getMyBookings(
                authentication.getName()
        );
    }

    // 3. Xem chi tiết đơn đặt vé
    @GetMapping("/{id}")
    @PreAuthorize(
        "hasAnyAuthority('BOOKING_READ_OWN', 'BOOKING_READ_ANY')"
    )
    public BookingResponse getBookingById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        // BookingService kiểm tra người sở hữu đơn.
        return bookingService.getBookingById(
                id,
                authentication.getName()
        );
    }

    // 4. Hủy đơn đặt vé của bản thân
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('BOOKING_CANCEL_OWN')")
    public BookingResponse cancelBooking(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return bookingService.cancelBooking(
                id,
                authentication.getName()
        );
    }
}
