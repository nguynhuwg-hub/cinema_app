package com.example.demo.module.showtime.repository;

import com.example.demo.module.showtime.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    // 1. Kiểm tra trùng lịch chiếu tại cùng 1 phòng chiếu (Hall)
    // Trường hợp trùng: (startTime < newEndTime) AND (endTime > newStartTime)
    @Query("""
        SELECT COUNT(s) > 0 FROM Showtime s 
        WHERE s.hall.id = :hallId 
          AND s.startTime < :endTime 
          AND s.endTime > :startTime
    """)
    boolean existsOverlappingShowtime(
            @Param("hallId") Long hallId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    // Kiểm tra trùng lịch khi Update (loại trừ chính ID đang sửa)
    @Query("""
        SELECT COUNT(s) > 0 FROM Showtime s 
        WHERE s.hall.id = :hallId 
          AND s.id != :excludeShowtimeId
          AND s.startTime < :endTime 
          AND s.endTime > :startTime
    """)
    boolean existsOverlappingShowtimeExcludingId(
            @Param("hallId") Long hallId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeShowtimeId") Long excludeShowtimeId
    );

    // 2. Tra cứu lịch chiếu theo Phim, Rạp (thông qua Hall) và Khoảng thời gian
    @Query("""
        SELECT s FROM Showtime s 
        JOIN FETCH s.movie m 
        JOIN FETCH s.hall h 
        WHERE (:movieId IS NULL OR m.id = :movieId)
          AND (:hallId IS NULL OR h.id = :hallId)
          AND (:cinemaId IS NULL OR h.cinema.id = :cinemaId)
          AND (:startOfDay IS NULL OR s.startTime >= :startOfDay)
          AND (:endOfDay IS NULL OR s.startTime <= :endOfDay)
        ORDER BY s.startTime ASC
    """)
    List<Showtime> searchShowtimes(
            @Param("movieId") Long movieId,
            @Param("cinemaId") Long cinemaId,
            @Param("hallId") Long hallId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );
}
