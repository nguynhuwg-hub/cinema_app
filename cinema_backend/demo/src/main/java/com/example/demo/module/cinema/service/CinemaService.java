package com.example.demo.module.cinema.service;

import com.example.demo.module.cinema.dto.cinema.CinemaResponse;
import com.example.demo.module.cinema.dto.cinema.CreateCinemaRequest;
import com.example.demo.module.cinema.dto.cinema.UpdateCinemaRequest;
import com.example.demo.module.cinema.entity.Cinema;
import com.example.demo.module.cinema.entity.City;
import com.example.demo.module.cinema.repository.CinemaRepository;
import com.example.demo.module.cinema.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CinemaService {

    private final CinemaRepository cinemaRepository;
    private final CityRepository cityRepository;

    public List<CinemaResponse> getAllCinemas() {
        return cinemaRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CinemaResponse getCinemaById(Long id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cinema not found with id: " + id));
        return mapToResponse(cinema);
    }

    public List<CinemaResponse> getCinemasByCity(Long cityId) {
        return cinemaRepository.findByCityId(cityId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CinemaResponse createCinema(CreateCinemaRequest request) {
        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new RuntimeException("City not found with id: " + request.getCityId()));

        Cinema cinema = Cinema.builder()
                .name(request.getName())
                .address(request.getAddress())
                .description(request.getDescription())
                .city(city)
                .build();

        return mapToResponse(cinemaRepository.save(cinema));
    }

    public CinemaResponse updateCinema(Long id, UpdateCinemaRequest request) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cinema not found with id: " + id));

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new RuntimeException("City not found with id: " + request.getCityId()));

        cinema.setName(request.getName());
        cinema.setAddress(request.getAddress());
        cinema.setDescription(request.getDescription());
        cinema.setCity(city);

        return mapToResponse(cinemaRepository.save(cinema));
    }

    public void deleteCinema(Long id) {
        cinemaRepository.deleteById(id);
    }

    private CinemaResponse mapToResponse(Cinema cinema) {
        return CinemaResponse.builder()
                .id(cinema.getId())
                .name(cinema.getName())
                .address(cinema.getAddress())
                .description(cinema.getDescription())
                .cityId(cinema.getCity().getId())
                .cityName(cinema.getCity().getName())
                .build();
    }
}
