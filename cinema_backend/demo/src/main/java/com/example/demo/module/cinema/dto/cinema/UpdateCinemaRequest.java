package com.example.demo.module.cinema.dto.cinema;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCinemaRequest {
    private String name;
    private String address;
    private Long cityId;
    private String description;
}
