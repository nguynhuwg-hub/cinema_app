package com.example.demo.module.showtime.service.impl;

import com.example.demo.entity.enums.SeatStatus;
import com.example.demo.module.showtime.dto.request.UpdateSeatStatusRequest;
import com.example.demo.module.showtime.dto.response.SeatLayoutResponse;
import com.example.demo.module.showtime.dto.response.ShowtimeSeatResponse;
import com.example.demo.module.showtime.entity.ShowtimeSeat;
import com.example.demo.module.showtime.repository.ShowtimeSeatRepository;
import com.example.demo.module.showtime.service.ShowtimeSeatService;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeSeatServiceImpl implements ShowtimeSeatService {

    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public SeatLayoutResponse getSeatLayoutByShowtimeId(Long showtimeId) {
        List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeIdWithDetails(showtimeId);

        List<ShowtimeSeatResponse> seatResponses = seats.stream()
                .map(this::mapToResponse)
                .toList();

        int availableSeats = (int) seats.stream()
                .filter(s -> SeatStatus.AVAILABLE.equals(s.getStatus()))
                .count();

        return SeatLayoutResponse.builder()
                .showtimeId(showtimeId)
                .totalSeats(seats.size())
                .availableSeats(availableSeats)
                .seats(seatResponses)
                .build();
    }

    @Override
    @Transactional
    public List<ShowtimeSeatResponse> updateSeatStatus(Long showtimeId, UpdateSeatStatusRequest request) {
        List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeIdAndIdIn(
                showtimeId, request.getShowtimeSeatIds());

        if (seats.size() != request.getShowtimeSeatIds().size()) {
            throw new IllegalArgumentException("Some seats do not belong to showtime id: " + showtimeId);
        }

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));
        }

        User finalUser = user;
        seats.forEach(seat -> {
            seat.setStatus(request.getStatus());
            if (SeatStatus.HELD.equals(request.getStatus())) {
                seat.setHeldByUser(finalUser);
                seat.setHoldExpiresAt(LocalDateTime.now().plusMinutes(10)); // Giữ ghế trong 10 phút
            } else if (SeatStatus.AVAILABLE.equals(request.getStatus())) {
                seat.setHeldByUser(null);
                seat.setHoldExpiresAt(null);
            }
        });

        List<ShowtimeSeat> updatedSeats = showtimeSeatRepository.saveAll(seats);
        return updatedSeats.stream().map(this::mapToResponse).toList();
    }

    private ShowtimeSeatResponse mapToResponse(ShowtimeSeat seat) {
        return ShowtimeSeatResponse.builder()
                .id(seat.getId())
                .showtimeId(seat.getShowtime().getId())
                .seatId(seat.getSeat().getId())
                .seatNumber(seat.getSeat().getSeatRow() + seat.getSeat().getSeatNumber())
                .status(seat.getStatus())
                .heldByUserId(seat.getHeldByUser() != null ? seat.getHeldByUser().getId() : null)
                .heldByUserName(seat.getHeldByUser() != null ? seat.getHeldByUser().getFullName() : null)
                .holdExpiresAt(seat.getHoldExpiresAt())
                .build();
    }
}