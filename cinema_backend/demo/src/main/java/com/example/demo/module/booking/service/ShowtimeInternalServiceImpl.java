package com.example.demo.module.booking.service;

import com.example.demo.module.booking.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ShowtimeInternalServiceImpl implements ShowtimeInternalService {

    private final TicketRepository ticketRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String SEAT_HOLD_KEY_PREFIX = "showtime:%d:seat:%d";
    private static final String BOOKING_SEATS_KEY_PREFIX = "booking:%d:seats";

    @Override
    public boolean areSeatsAvailable(Long showtimeId, List<Long> seatIds) {
        // 1. Kiểm tra trong Database xem vé đã bán thành công chưa (PAID)
        boolean isBookedInDb = ticketRepository.existsByBookingShowtimeIdAndSeatIdIn(showtimeId, seatIds);
        if (isBookedInDb) {
            return false;
        }

        // 2. Kiểm tra trên Redis xem có ai đang giữ tạm thời không
        for (Long seatId : seatIds) {
            String redisKey = String.format(SEAT_HOLD_KEY_PREFIX, showtimeId, seatId);
            Boolean isHeld = redisTemplate.hasKey(redisKey);
            if (Boolean.TRUE.equals(isHeld)) {
                return false;
            }
        }

        return true;
    }

    @Override
    public void holdSeats(Long showtimeId, List<Long> seatIds, Long bookingId) {
        Duration holdDuration = Duration.ofMinutes(10);
        List<String> successfullyHeldKeys = new ArrayList<>(); // Lưu lại các key đã khóa thành công

        try {
            // 1. Dùng SETNX (setIfAbsent) để khóa ghế nguyên tử trên Redis
            for (Long seatId : seatIds) {
                String seatKey = String.format(SEAT_HOLD_KEY_PREFIX, showtimeId, seatId);
                Boolean success = redisTemplate.opsForValue()
                        .setIfAbsent(seatKey, String.valueOf(bookingId), holdDuration);

                if (Boolean.TRUE.equals(success)) {
                    successfullyHeldKeys.add(seatKey); // Ghi nhận đã khóa thành công ghế này
                } else {
                    // Nếu gặp 1 ghế bị trùng -> Ném exception để hủy toàn bộ quá trình
                    throw new RuntimeException("Ghế ID " + seatId + " vừa bị người khác nhanh tay giữ trước!");
                }
            }

            // 2. Nếu tất cả ghế đều giữ thành công, lưu mapping bookingId -> danh sách ghế
            String bookingKey = String.format(BOOKING_SEATS_KEY_PREFIX, bookingId);
            for (String seatKey : successfullyHeldKeys) {
                redisTemplate.opsForSet().add(bookingKey, seatKey);
            }
            redisTemplate.expire(bookingKey, holdDuration);

        } catch (Exception e) {
            // ROLLBACK REDIS: Nếu có lỗi (ví dụ ghế thứ 3 bị trùng), xóa ngay các key ghế đã lỡ khóa trước đó
            if (!successfullyHeldKeys.isEmpty()) {
                redisTemplate.delete(successfullyHeldKeys);
            }
            // Ném lại Exception ra ngoài để Transaction của MySQL rollback luôn
            throw e;
        }
    }

    @Override
    public void releaseSeats(Long bookingId) {
        String bookingKey = String.format(BOOKING_SEATS_KEY_PREFIX, bookingId);

        // Lấy toàn bộ danh sách ghế thuộc bookingId này trên Redis và xóa đi
        Set<String> seatKeys = redisTemplate.opsForSet().members(bookingKey);
        if (seatKeys != null && !seatKeys.isEmpty()) {
            redisTemplate.delete(seatKeys);
        }

        // Xóa key mapping của booking
        redisTemplate.delete(bookingKey);
    }
}