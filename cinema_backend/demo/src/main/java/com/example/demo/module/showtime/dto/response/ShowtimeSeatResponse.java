package com.example.demo.module.showtime.dto.response;

import com.example.demo.entity.enums.SeatStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowtimeSeatResponse {

    private Long id;
    private Long showtimeId;
    private Long seatId;
    private String seatNumber; 
    private SeatStatus status;
    private Long heldByUserId;
    private String heldByUserName;
    private LocalDateTime holdExpiresAt;
}
