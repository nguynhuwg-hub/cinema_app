package com.example.demo.module.booking.repository;

import com.example.demo.module.booking.entity.Ticket;
import com.example.demo.module.booking.enums.BookingStatus;

import jakarta.persistence.LockModeType;
import jakarta.persistence.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository
        extends JpaRepository<Ticket, Long> {

    boolean existsByBookingShowtimeIdAndSeatIdInAndBookingStatus(
            Long showtimeId,
            List<Long> seatIds,
            BookingStatus status
    );

    List<Ticket> findByBookingIdOrderById(Long bookingId);

    List<Ticket> findByBookingShowtimeIdAndBookingStatus(
            Long showtimeId,
            BookingStatus status
    );

    // Tra cứu thông tin vé theo mã QR
    Optional<Ticket> findByTicketCode(String ticketCode);

    // Khóa vé khi check-in để chống quét trùng đồng thời
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT t
        FROM Ticket t
        WHERE t.ticketCode = :ticketCode
    """)
    Optional<Ticket> findByTicketCodeForUpdate(
            @Param("ticketCode") String ticketCode
    );
}