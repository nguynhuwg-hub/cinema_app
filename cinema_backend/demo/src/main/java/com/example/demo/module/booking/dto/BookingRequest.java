package com.example.demo.module.booking.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BookingRequest {

    @NotNull
    @Positive
    private Long showtimeId;

    @NotEmpty
    private List<@NotNull @Positive Long> seatIds;

    private List<Long> concessionIds;
}