package com.example.demo.module.cinema.controller;

import com.example.demo.module.cinema.dto.hall.CreateHallRequest;
import com.example.demo.module.cinema.dto.hall.HallResponse;
import com.example.demo.module.cinema.service.HallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/halls")
@RequiredArgsConstructor
public class HallController {

    private final HallService hallService;

    @GetMapping
    @PreAuthorize("hasAuthority('HALL_READ')")
    public ResponseEntity<List<HallResponse>> getAllHalls() {
        return ResponseEntity.ok(hallService.getAllHalls());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('HALL_READ')")
    public ResponseEntity<HallResponse> getHallById(@PathVariable Long id) {
        return ResponseEntity.ok(hallService.getHallById(id));
    }

    @GetMapping("/cinema/{cinemaId}")
    @PreAuthorize("hasAuthority('HALL_READ')")
    public ResponseEntity<List<HallResponse>> getHallsByCinema(
            @PathVariable Long cinemaId) {
        return ResponseEntity.ok(
                hallService.getHallsByCinema(cinemaId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('HALL_CREATE')")
    public ResponseEntity<HallResponse> createHall(
            @RequestBody CreateHallRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(hallService.createHall(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('HALL_DELETE')")
    public ResponseEntity<Void> deleteHall(@PathVariable Long id) {
        hallService.deleteHall(id);
        return ResponseEntity.noContent().build();
    }
}