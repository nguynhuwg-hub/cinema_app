package com.example.demo.module.showtime.repository;

import com.example.demo.entity.enums.SeatStatus;
import com.example.demo.module.showtime.entity.ShowtimeSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShowtimeSeatRepository extends JpaRepository<ShowtimeSeat, Long> {

    // 1. Lấy toàn bộ ghế của 1 suất chiếu (FETCH JOIN Seat để lấy tên/số ghế)
    @Query("""
        SELECT ss FROM ShowtimeSeat ss 
        JOIN FETCH ss.seat s 
        LEFT JOIN FETCH ss.heldByUser u 
        WHERE ss.showtime.id = :showtimeId 
        ORDER BY s.seatRow ASC, s.seatNumber ASC
    """)
    List<ShowtimeSeat> findByShowtimeIdWithDetails(@Param("showtimeId") Long showtimeId);

    // 2. Tìm danh sách ghế theo danh sách ID truyền vào và phải thuộc đúng showtimeId
    List<ShowtimeSeat> findByShowtimeIdAndIdIn(Long showtimeId, List<Long> ids);

    // 3. Đếm số lượng ghế khả dụng (status = AVAILABLE) của 1 suất chiếu
    int countByShowtimeIdAndStatus(Long showtimeId, SeatStatus status);

    // 4. Tự động giải phóng các ghế hết hạn giữ chỗ (Hold Expiration Batch Processing)
    @Modifying
    @Query("""
        UPDATE ShowtimeSeat ss 
        SET ss.status = 'AVAILABLE', 
            ss.heldByUser = NULL, 
            ss.holdExpiresAt = NULL 
        WHERE ss.status = 'RESERVED' 
          AND ss.holdExpiresAt IS NOT NULL 
          AND ss.holdExpiresAt < :now
    """)
    int releaseExpiredSeats(@Param("now") LocalDateTime now);
}
