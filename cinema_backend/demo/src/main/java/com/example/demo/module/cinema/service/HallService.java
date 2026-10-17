package com.example.demo.module.cinema.service;

import com.example.demo.common.enums.SeatType;
import com.example.demo.module.cinema.dto.hall.CreateHallRequest;
import com.example.demo.module.cinema.dto.hall.HallResponse;
import com.example.demo.module.cinema.entity.Cinema;
import com.example.demo.module.cinema.entity.Hall;
import com.example.demo.module.cinema.entity.Seat;
import com.example.demo.module.cinema.repository.CinemaRepository;
import com.example.demo.module.cinema.repository.HallRepository;
import com.example.demo.module.cinema.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HallService {

    private final HallRepository hallRepository;
    private final CinemaRepository cinemaRepository;
    private final SeatRepository seatRepository;

    public List<HallResponse> getAllHalls() {
        return hallRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public HallResponse getHallById(Long id) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hall not found with id: " + id));
        return mapToResponse(hall);
    }

    public List<HallResponse> getHallsByCinema(Long cinemaId) {
        return hallRepository.findByCinemaId(cinemaId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public HallResponse createHall(CreateHallRequest request) {
        Cinema cinema = cinemaRepository.findById(request.getCinemaId())
                .orElseThrow(() -> new RuntimeException("Cinema not found with id: " + request.getCinemaId()));

        int totalSeats = request.getTotalRows() * request.getSeatsPerRow();

        Hall hall = Hall.builder()
                .name(request.getName())
                .totalSeats(totalSeats)
                .cinema(cinema)
                .build();

        Hall savedHall = hallRepository.save(hall);

        // Logic tự động khởi tạo danh sách ghế trong phòng
        List<Seat> seats = new ArrayList<>();
        for (int r = 0; r < request.getTotalRows(); r++) {
            String rowName = String.valueOf((char) ('A' + r)); // Chuyển 0, 1, 2... thành A, B, C...
            for (int col = 1; col <= request.getSeatsPerRow(); col++) {
                Seat seat = Seat.builder()
                        .hall(savedHall)
                        .seatRow(rowName)
                        .seatNumber(String.valueOf(col))
                        .seatType(SeatType.NORMAL) // Mặc định tạo ghế thường
                        .build();
                seats.add(seat);
            }
        }
        seatRepository.saveAll(seats);

        return mapToResponse(savedHall);
    }

    public void deleteHall(Long id) {
        hallRepository.deleteById(id);
    }

    private HallResponse mapToResponse(Hall hall) {
        return HallResponse.builder()
                .id(hall.getId())
                .name(hall.getName())
                .totalSeats(hall.getTotalSeats())
                .cinemaId(hall.getCinema().getId())
                .cinemaName(hall.getCinema().getName())
                .build();
    }
}
