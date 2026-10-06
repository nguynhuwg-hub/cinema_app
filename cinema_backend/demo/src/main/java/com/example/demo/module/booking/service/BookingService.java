package com.example.demo.module.booking.service;

import com.example.demo.module.booking.dto.BookingRequest;
import com.example.demo.module.booking.dto.BookingResponse;

import java.util.List;

public interface BookingService {
    BookingResponse createBooking(BookingRequest request);
    BookingResponse getBookingById(Long id);
    BookingResponse confirmPayment(Long bookingId, List<Long> seatIds);
}