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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;

    @PostMapping
    @PreAuthorize("hasAuthority('SHOWTIME_CREATE')")
    public ResponseEntity<ShowtimeResponse> createShowtime(
            @Valid @RequestBody CreateShowtimeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(showtimeService.createShowtime(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SHOWTIME_READ')")
    public ResponseEntity<ShowtimeDetailResponse> getShowtimeById(
            @PathVariable Long id) {
        return ResponseEntity.ok(showtimeService.getShowtimeById(id));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('SHOWTIME_READ')")
    public ResponseEntity<List<ShowtimeResponse>> searchShowtimes(
            @Valid ShowtimeSearchFilter filter) {
        return ResponseEntity.ok(
                showtimeService.searchShowtimes(filter));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('SHOWTIME_UPDATE')")
    public ResponseEntity<ShowtimeResponse> updateShowtime(
            @PathVariable Long id,
            @Valid @RequestBody UpdateShowtimeRequest request) {
        return ResponseEntity.ok(
                showtimeService.updateShowtime(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('SHOWTIME_DELETE')")
    public ResponseEntity<Void> deleteShowtime(@PathVariable Long id) {
        showtimeService.deleteShowtime(id);
        return ResponseEntity.noContent().build();
    }
}