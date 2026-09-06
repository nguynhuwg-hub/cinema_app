package com.example.demo.module.cinema.dto.cinema;

import lombok.Data;

@Data
public class CreateCinemaRequest {
    private String name;
    private String address;
    private String description;
    private Long cityId;
}