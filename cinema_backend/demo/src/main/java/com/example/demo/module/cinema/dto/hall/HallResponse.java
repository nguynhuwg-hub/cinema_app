package com.example.demo.module.cinema.dto.hall;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HallResponse {
    private Long id;
    private String name;
    private Integer totalSeats;
    private Long cinemaId;
    private String cinemaName;
}
