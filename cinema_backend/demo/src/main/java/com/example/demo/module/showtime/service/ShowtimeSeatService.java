package com.example.demo.module.showtime.service;

import com.example.demo.module.showtime.dto.request.UpdateSeatStatusRequest;
import com.example.demo.module.showtime.dto.response.SeatLayoutResponse;
import com.example.demo.module.showtime.dto.response.ShowtimeSeatResponse;

import java.util.List;

public interface ShowtimeSeatService {
    SeatLayoutResponse getSeatLayoutByShowtimeId(Long showtimeId);
    List<ShowtimeSeatResponse> updateSeatStatus(Long showtimeId, UpdateSeatStatusRequest request);
}
