package com.example.demo.module.showtime.entity;

import com.example.demo.entity.enums.SeatStatus;
import com.example.demo.module.cinema.entity.Seat;
import com.example.demo.module.user.entity.User;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "showtime_seats",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"showtime_id", "seat_id"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShowtimeSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeatStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "held_by_user_id")
    private User heldByUser;

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    @Version // Khóa lạc quan (Optimistic Locking) chống ghi đè dữ liệu khi 2 người bấm cùng lúc
    private Long version;
}