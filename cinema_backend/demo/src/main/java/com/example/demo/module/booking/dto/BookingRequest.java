package com.example.demo.module.booking.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BookingRequest {
    private Long userId;
    private Long showtimeId;
    private List<Long> seatIds;        // Danh sách ID các ghế muốn đặt
    private List<Long> concessionIds;  // Danh sách ID các món bắp nước chọn kèm (nếu có)
}