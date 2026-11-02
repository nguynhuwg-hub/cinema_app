package com.example.demo.module.booking.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class BookingConcessionResponse {

    private Long concessionId;

    private String name;

    private Integer quantity;

    private BigDecimal unitPrice;

    private BigDecimal lineTotal;
}