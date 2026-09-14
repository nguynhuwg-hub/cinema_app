package com.example.demo.module.booking.repository;

import com.example.demo.module.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Tìm lịch sử đặt vé của 1 User
    List<Booking> findByUserId(Long userId);

    // Tìm các đơn đặt vé theo trạng thái (VD: "PENDING", "PAID")
    List<Booking> findByStatus(String status);
}
