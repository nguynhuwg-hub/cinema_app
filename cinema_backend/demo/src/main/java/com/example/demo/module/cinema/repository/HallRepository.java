package com.example.demo.module.cinema.repository;

import com.example.demo.module.cinema.entity.Hall;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface HallRepository extends JpaRepository<Hall, Long> {
    List<Hall> findByCinemaId(Long cinemaId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT h
            FROM Hall h
            WHERE h.id = :hallId
            """)
    Optional<Hall> findByIdForShowtimeCreation(
            @Param("hallId") Long hallId
    );
}
