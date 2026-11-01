package com.example.demo.module.showtime.repository;

import com.example.demo.entity.enums.SeatStatus;
import com.example.demo.module.showtime.entity.ShowtimeSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShowtimeSeatRepository
        extends JpaRepository<ShowtimeSeat, Long> {

    // Lấy sơ đồ ghế và thông tin người đang giữ ghế.
    @Query("""
            SELECT ss
            FROM ShowtimeSeat ss
            JOIN FETCH ss.seat s
            LEFT JOIN FETCH ss.heldByUser u
            WHERE ss.showtime.id = :showtimeId
            ORDER BY s.seatRow ASC, s.seatNumber ASC
            """)
    List<ShowtimeSeat> findByShowtimeIdWithDetails(
            @Param("showtimeId") Long showtimeId
    );

    // Tìm theo ID của ShowtimeSeat, không phải ID ghế vật lý.
    List<ShowtimeSeat> findByShowtimeIdAndIdIn(
            Long showtimeId,
            List<Long> ids
    );

    // Đếm ghế theo trạng thái.
    int countByShowtimeIdAndStatus(
            Long showtimeId,
            SeatStatus status
    );

    // Đếm toàn bộ ghế của suất chiếu.
    int countByShowtimeId(Long showtimeId);
}