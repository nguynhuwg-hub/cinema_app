package com.example.demo.module.booking.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class BookingResponse {
    private Long id;
    private Long userId;
    private Long showtimeId;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
    private List<Long> seatIds;
    private List<Long> concessionIds;
}