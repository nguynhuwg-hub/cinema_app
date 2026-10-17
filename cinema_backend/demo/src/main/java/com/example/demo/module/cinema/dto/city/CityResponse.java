package com.example.demo.module.cinema.dto.city;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CityResponse {
    private Long id;
    private String name;
}
