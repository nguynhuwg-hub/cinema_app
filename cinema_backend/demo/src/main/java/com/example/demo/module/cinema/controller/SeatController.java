package com.example.demo.module.cinema.controller;

import com.example.demo.module.cinema.dto.seat.SeatResponse;
import com.example.demo.module.cinema.dto.seat.UpdateSeatTypeRequest;
import com.example.demo.module.cinema.service.SeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seats")
@RequiredArgsConstructor
public class SeatController {

    private final SeatService seatService;

    @GetMapping("/hall/{hallId}")
    public ResponseEntity<List<SeatResponse>> getSeatsByHall(@PathVariable Long hallId) {
        return ResponseEntity.ok(seatService.getSeatsByHall(hallId));
    }

    @PutMapping("/{id}/type")
    public ResponseEntity<SeatResponse> updateSeatType(
            @PathVariable Long id, 
            @RequestBody UpdateSeatTypeRequest request) {
        return ResponseEntity.ok(seatService.updateSeatType(id, request));
    }
}