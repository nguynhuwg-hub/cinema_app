
package com.example.demo.module.booking.repository;

import com.example.demo.module.booking.entity.Booking;
import com.example.demo.module.booking.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByShowtimeIdAndStatus(
            Long showtimeId,
            BookingStatus status
    );

    // Kiểm tra suất chiếu đã phát sinh Booking hay chưa.
    // Bao gồm cả PENDING, PAID, CANCELLED và EXPIRED.
    boolean existsByShowtimeId(Long showtimeId);

    List<Booking> findByUserEmailOrderByCreatedAtDesc(String email);

    @Query("""
            SELECT b.showtime.id
            FROM Booking b
            WHERE b.id = :id
            """)
    Optional<Long> findShowtimeId(@Param("id") Long id);

    @Query("""
            SELECT DISTINCT b.showtime.id
            FROM Booking b
            WHERE b.status = :status
              AND (
                  b.holdExpiresAt <= :now
                  OR b.holdExpiresAt IS NULL
              )
            ORDER BY b.showtime.id
            """)
    List<Long> findExpiredShowtimeIds(
            @Param("status") BookingStatus status,
            @Param("now") LocalDateTime now
    );
}
