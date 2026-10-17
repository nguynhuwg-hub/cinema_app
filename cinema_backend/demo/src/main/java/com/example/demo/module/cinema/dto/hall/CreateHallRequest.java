package com.example.demo.module.cinema.dto.hall;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateHallRequest {
    private Long cinemaId;
    private String name;
    private Integer totalRows;     
    private Integer seatsPerRow;  
}