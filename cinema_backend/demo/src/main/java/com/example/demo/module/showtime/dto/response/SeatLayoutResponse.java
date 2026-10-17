package com.example.demo.module.showtime.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatLayoutResponse {

    private Long showtimeId;
    private Integer totalSeats;
    private Integer availableSeats;
    private List<ShowtimeSeatResponse> seats;
}