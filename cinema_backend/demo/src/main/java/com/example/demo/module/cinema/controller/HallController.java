package com.example.demo.module.cinema.controller;

import com.example.demo.module.cinema.dto.hall.CreateHallRequest;
import com.example.demo.module.cinema.dto.hall.HallResponse;
import com.example.demo.module.cinema.service.HallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/halls")
@RequiredArgsConstructor
public class HallController {

    private final HallService hallService;

    @GetMapping
    public ResponseEntity<List<HallResponse>> getAllHalls() {
        return ResponseEntity.ok(hallService.getAllHalls());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HallResponse> getHallById(@PathVariable Long id) {
        return ResponseEntity.ok(hallService.getHallById(id));
    }

    @GetMapping("/cinema/{cinemaId}")
    public ResponseEntity<List<HallResponse>> getHallsByCinema(@PathVariable Long cinemaId) {
        return ResponseEntity.ok(hallService.getHallsByCinema(cinemaId));
    }

    @PostMapping
    public ResponseEntity<HallResponse> createHall(@RequestBody CreateHallRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hallService.createHall(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHall(@PathVariable Long id) {
        hallService.deleteHall(id);
        return ResponseEntity.noContent().build();
    }
}