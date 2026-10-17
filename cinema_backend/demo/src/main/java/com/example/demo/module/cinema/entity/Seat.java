package com.example.demo.module.cinema.entity;

import com.example.demo.common.enums.SeatType;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seats")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_id", nullable = false)
    private Hall hall;

    @Column(name = "seat_row", nullable = false, length = 5)
    private String seatRow; // Ví dụ: A, B, C

    @Column(name = "seat_number", nullable = false)
    private String seatNumber; // Ví dụ: 1, 2, 3

    @Enumerated(EnumType.STRING)
    @Column(name = "seat_type", nullable = false, length = 20)
    private SeatType seatType;
}