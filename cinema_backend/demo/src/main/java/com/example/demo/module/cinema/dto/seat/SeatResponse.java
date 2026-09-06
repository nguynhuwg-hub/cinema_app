package com.example.demo.module.cinema.dto.seat;

import com.example.demo.common.enums.SeatType;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SeatResponse {
    private Long id;
    private String seatRow;     // Ví dụ: "A"
    private String seatNumber; // Ví dụ: 1
    private String fullSeatName;// Ví dụ: "A1"
    private SeatType seatType;  // REGULAR, VIP, SWEETBOX
    private Long hallId;
}
