package com.example.demo.module.cinema.service;

import com.example.demo.module.cinema.dto.seat.SeatResponse;
import com.example.demo.module.cinema.dto.seat.UpdateSeatTypeRequest;
import com.example.demo.module.cinema.entity.Seat;
import com.example.demo.module.cinema.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;

    public List<SeatResponse> getSeatsByHall(Long hallId) {
        return seatRepository.findByHallId(hallId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public SeatResponse updateSeatType(Long id, UpdateSeatTypeRequest request) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Seat not found with id: " + id));

        seat.setSeatType(request.getSeatType());
        return mapToResponse(seatRepository.save(seat));
    }

    private SeatResponse mapToResponse(Seat seat) {
        return SeatResponse.builder()
                .id(seat.getId())
                .seatRow(seat.getSeatRow())
                .seatNumber(seat.getSeatNumber())
                .fullSeatName(seat.getSeatRow() + seat.getSeatNumber())
                .seatType(seat.getSeatType())
                .hallId(seat.getHall().getId())
                .build();
    }
}
