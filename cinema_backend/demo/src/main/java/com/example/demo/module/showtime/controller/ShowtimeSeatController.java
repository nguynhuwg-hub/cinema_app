package com.example.demo.module.showtime.controller;

import com.example.demo.module.showtime.dto.request.UpdateSeatStatusRequest;
import com.example.demo.module.showtime.dto.response.SeatLayoutResponse;
import com.example.demo.module.showtime.dto.response.ShowtimeSeatResponse;
import com.example.demo.module.showtime.service.ShowtimeSeatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/showtimes/{showtimeId}/seats")
@RequiredArgsConstructor
public class ShowtimeSeatController {

    private final ShowtimeSeatService showtimeSeatService;

    @GetMapping
    public ResponseEntity<SeatLayoutResponse> getSeatLayout(@PathVariable Long showtimeId) {
        SeatLayoutResponse response = showtimeSeatService.getSeatLayoutByShowtimeId(showtimeId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/status")
    public ResponseEntity<List<ShowtimeSeatResponse>> updateSeatStatus(
            @PathVariable Long showtimeId,
            @Valid @RequestBody UpdateSeatStatusRequest request) {
        List<ShowtimeSeatResponse> responses = showtimeSeatService.updateSeatStatus(showtimeId, request);
        return ResponseEntity.ok(responses);
    }
}