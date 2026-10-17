package com.example.demo.module.cinema.controller;

import com.example.demo.module.cinema.dto.city.CityRequest;
import com.example.demo.module.cinema.dto.city.CityResponse;
import com.example.demo.module.cinema.service.CityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
public class CityController {

    private final CityService cityService;

    @GetMapping
    @PreAuthorize("hasAuthority('CITY_READ')")
    public ResponseEntity<List<CityResponse>> getAllCities() {
        return ResponseEntity.ok(cityService.getAllCities());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CITY_READ')")
    public ResponseEntity<CityResponse> getCityById(@PathVariable Long id) {
        return ResponseEntity.ok(cityService.getCityById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CITY_CREATE')")
    public ResponseEntity<CityResponse> createCity(
            @RequestBody CityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cityService.createCity(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CITY_UPDATE')")
    public ResponseEntity<CityResponse> updateCity(
            @PathVariable Long id,
            @RequestBody CityRequest request) {
        return ResponseEntity.ok(cityService.updateCity(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CITY_DELETE')")
    public ResponseEntity<Void> deleteCity(@PathVariable Long id) {
        cityService.deleteCity(id);
        return ResponseEntity.noContent().build();
    }
}