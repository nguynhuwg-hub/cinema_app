package com.example.demo.module.booking.service;

import com.example.demo.module.booking.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeInternalServiceMock implements ShowtimeInternalService {

    private final TicketRepository ticketRepository;

    @Override
    public boolean areSeatsAvailable(Long showtimeId, List<Long> seatIds) {
        // Kiểm tra xem đã có Ticket nào tồn tại trùng showtimeId và seatIds chưa
        boolean isBooked = ticketRepository.existsByBookingShowtimeIdAndSeatIdIn(showtimeId, seatIds);
        
        // Trả về true nếu chưa có vé nào (ghế trống), ngược lại trả về false
        return !isBooked;
    }

    @Override
    public void holdSeats(Long showtimeId, List<Long> seatIds, Long bookingId) {
        System.out.println("[MOCK LOG] Đã giữ ghế " + seatIds + " cho Booking ID: " + bookingId);
    }

    @Override
    public void releaseSeats(Long bookingId) {
        System.out.println("[MOCK LOG] Đã nhả ghế cho Booking ID: " + bookingId);
    }
}