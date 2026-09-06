package com.example.demo.module.cinema.controller;

import com.example.demo.module.cinema.dto.cinema.CinemaResponse;
import com.example.demo.module.cinema.dto.cinema.CreateCinemaRequest;
import com.example.demo.module.cinema.dto.cinema.UpdateCinemaRequest;
import com.example.demo.module.cinema.service.CinemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;

    @GetMapping
    public ResponseEntity<List<CinemaResponse>> getAllCinemas() {
        return ResponseEntity.ok(cinemaService.getAllCinemas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CinemaResponse> getCinemaById(@PathVariable Long id) {
        return ResponseEntity.ok(cinemaService.getCinemaById(id));
    }

    @GetMapping("/city/{cityId}")
    public ResponseEntity<List<CinemaResponse>> getCinemasByCity(@PathVariable Long cityId) {
        return ResponseEntity.ok(cinemaService.getCinemasByCity(cityId));
    }

    @PostMapping
    public ResponseEntity<CinemaResponse> createCinema(@RequestBody CreateCinemaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cinemaService.createCinema(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CinemaResponse> updateCinema(@PathVariable Long id, @RequestBody UpdateCinemaRequest request) {
        return ResponseEntity.ok(cinemaService.updateCinema(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCinema(@PathVariable Long id) {
        cinemaService.deleteCinema(id);
        return ResponseEntity.noContent().build();
    }
}
