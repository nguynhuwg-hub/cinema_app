package com.example.demo.module.booking.repository;

import com.example.demo.module.booking.entity.Booking;
import com.example.demo.module.booking.enums.BookingStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // Tìm lịch sử đặt vé của 1 User
    List<Booking> findByUserId(Long userId);

    // Tìm các đơn đặt vé theo trạng thái (VD: "PENDING", "PAID")
    List<Booking> findByStatus(String status);
    @Modifying
    @Query("UPDATE Booking b SET b.status = :newStatus WHERE b.status = :oldStatus AND b.createdAt < :cutoffTime")
    int updateExpiredBookings(
            @Param("oldStatus") BookingStatus oldStatus,
            @Param("newStatus") BookingStatus newStatus,
            @Param("cutoffTime") LocalDateTime cutoffTime
    );
}
