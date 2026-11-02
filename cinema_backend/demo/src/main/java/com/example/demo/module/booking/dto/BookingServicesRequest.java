package com.example.demo.module.booking.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BookingServicesRequest {

    @NotNull
    @Size(max = 50)
    private List<@NotNull @Valid Item> items = new ArrayList<>();

    @Size(max = 50)
    private String couponCode;

    @Getter
    @Setter
    public static class Item {

        @NotNull
        @Positive
        private Long concessionId;

        @NotNull
        @Min(1)
        @Max(99)
        private Integer quantity;
    }
}