package com.example.demo.module.booking.repository;

import com.example.demo.module.booking.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    // Spring sẽ hiểu là: ticket.booking.showtime.id
    boolean existsByBookingShowtimeIdAndSeatIdIn(Long showtimeId, List<Long> seatIds);
}