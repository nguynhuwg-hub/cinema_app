package com.example.demo.module.booking.service;

import com.example.demo.module.booking.dto.BookingRequest;
import com.example.demo.module.booking.dto.BookingResponse;

import java.math.BigDecimal;
import java.util.List;

public interface BookingService {

    BookingResponse createBooking(
            BookingRequest request,
            String email
    );

    BookingResponse getBookingById(
            Long id,
            String email
    );

    List<BookingResponse> getMyBookings(String email);

    BookingResponse cancelBooking(
            Long id,
            String email
    );

    BookingResponse preparePayment(
            Long id,
            String email
    );

    String applyVnpayPayment(
            Long id,
            BigDecimal amount,
            String transactionNo,
            String responseCode,
            boolean success
    );

    void expirePendingBookings();

    void saveVnpayTransaction(
        Long bookingId,
        String txnRef,
        String createDate
);
}