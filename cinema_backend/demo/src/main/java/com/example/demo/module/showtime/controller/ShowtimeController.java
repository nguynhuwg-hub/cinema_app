package com.example.demo.module.showtime.controller;

import com.example.demo.module.showtime.dto.request.CreateShowtimeRequest;
import com.example.demo.module.showtime.dto.request.ShowtimeSearchFilter;
import com.example.demo.module.showtime.dto.request.UpdateShowtimeRequest;
import com.example.demo.module.showtime.dto.response.ShowtimeDetailResponse;
import com.example.demo.module.showtime.dto.response.ShowtimeResponse;
import com.example.demo.module.showtime.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @PostMapping
    public ResponseEntity<ShowtimeResponse> createShowtime(@Valid @RequestBody CreateShowtimeRequest request) {
        ShowtimeResponse response = showtimeService.createShowtime(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShowtimeDetailResponse> getShowtimeById(@PathVariable Long id) {
        ShowtimeDetailResponse response = showtimeService.getShowtimeById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ShowtimeResponse>> searchShowtimes(@Valid ShowtimeSearchFilter filter) {
        List<ShowtimeResponse> responses = showtimeService.searchShowtimes(filter);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShowtimeResponse> updateShowtime(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShowtimeRequest request) {
        ShowtimeResponse response = showtimeService.updateShowtime(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShowtime(@PathVariable Long id) {
        showtimeService.deleteShowtime(id);
        return ResponseEntity.noContent().build();
    }
}