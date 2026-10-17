package com.example.demo.module.cinema.dto.cinema;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CinemaResponse {
    private Long id;
    private String name;
    private String address;
    private Long cityId;
    private String cityName;
    private String description;
}