package com.example.demo.module.cinema.service;

import com.example.demo.module.cinema.dto.city.CityRequest;
import com.example.demo.module.cinema.dto.city.CityResponse;
import com.example.demo.module.cinema.entity.City;
import com.example.demo.module.cinema.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CityService {

    private final CityRepository cityRepository;

    public List<CityResponse> getAllCities() {
        return cityRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public CityResponse getCityById(Long id) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("City not found with id: " + id));
        return mapToResponse(city);
    }

    public CityResponse createCity(CityRequest request) {
        City city = City.builder()
                .name(request.getName())
                .build();
        return mapToResponse(cityRepository.save(city));
    }

    public CityResponse updateCity(Long id, CityRequest request) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("City not found with id: " + id));
        city.setName(request.getName());
        return mapToResponse(cityRepository.save(city));
    }

    public void deleteCity(Long id) {
        cityRepository.deleteById(id);
    }

    private CityResponse mapToResponse(City city) {
        return CityResponse.builder()
                .id(city.getId())
                .name(city.getName())
                .build();
    }
}