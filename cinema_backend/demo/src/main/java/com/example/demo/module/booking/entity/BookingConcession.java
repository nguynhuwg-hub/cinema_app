package com.example.demo.module.booking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

import com.example.demo.entity.Concession;

@Entity
@Table(name = "booking_concessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingConcession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concession_id", nullable = false)
    private Concession concession;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}
