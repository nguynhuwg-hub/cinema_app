package com.example.demo.module.user.event.payload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class BookingSuccessEvent {
    private Long userId;
    private String bookingCode;
    private String movieTitle;
    private Double totalAmount;
}
