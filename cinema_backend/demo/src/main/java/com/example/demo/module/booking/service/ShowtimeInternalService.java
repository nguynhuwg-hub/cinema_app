package com.example.demo.module.booking.service;

import java.util.List;

public interface ShowtimeInternalService {
    // 1. Kiểm tra danh sách ghế có đang rảnh không
    boolean areSeatsAvailable(Long showtimeId, List<Long> seatIds);

    // 2. Tạm thời khóa ghế lại khi bắt đầu tạo đơn đặt vé
    void holdSeats(Long showtimeId, List<Long> seatIds, Long bookingId);

    // 3. Nhả ghế ra nếu quá 10 phút khách không chịu trả tiền
    void releaseSeats(Long bookingId);
}
