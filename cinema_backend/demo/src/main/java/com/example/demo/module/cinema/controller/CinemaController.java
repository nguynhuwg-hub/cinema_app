package com.example.demo.module.cinema.controller;

import com.example.demo.module.cinema.dto.cinema.CinemaResponse;
import com.example.demo.module.cinema.dto.cinema.CreateCinemaRequest;
import com.example.demo.module.cinema.dto.cinema.UpdateCinemaRequest;
import com.example.demo.module.cinema.service.CinemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;

    @GetMapping
    @PreAuthorize("hasAuthority('CINEMA_READ')")
    public ResponseEntity<List<CinemaResponse>> getAllCinemas() {
        return ResponseEntity.ok(cinemaService.getAllCinemas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CINEMA_READ')")
    public ResponseEntity<CinemaResponse> getCinemaById(
            @PathVariable Long id) {
        return ResponseEntity.ok(cinemaService.getCinemaById(id));
    }

    @GetMapping("/city/{cityId}")
    @PreAuthorize("hasAuthority('CINEMA_READ')")
    public ResponseEntity<List<CinemaResponse>> getCinemasByCity(
            @PathVariable Long cityId) {
        return ResponseEntity.ok(
                cinemaService.getCinemasByCity(cityId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CINEMA_CREATE')")
    public ResponseEntity<CinemaResponse> createCinema(
            @RequestBody CreateCinemaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cinemaService.createCinema(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CINEMA_UPDATE')")
    public ResponseEntity<CinemaResponse> updateCinema(
            @PathVariable Long id,
            @RequestBody UpdateCinemaRequest request) {
        return ResponseEntity.ok(cinemaService.updateCinema(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CINEMA_DELETE')")
    public ResponseEntity<Void> deleteCinema(@PathVariable Long id) {
        cinemaService.deleteCinema(id);
        return ResponseEntity.noContent().build();
    }
}