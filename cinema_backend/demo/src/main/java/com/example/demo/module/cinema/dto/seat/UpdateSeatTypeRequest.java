package com.example.demo.module.cinema.dto.seat;

import com.example.demo.common.enums.SeatType;
import lombok.Data;

@Data
public class UpdateSeatTypeRequest {
    private SeatType seatType;
}