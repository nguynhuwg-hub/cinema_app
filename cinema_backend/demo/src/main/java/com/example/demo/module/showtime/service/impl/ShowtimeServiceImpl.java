package com.example.demo.module.showtime.service.impl;

import com.example.demo.entity.enums.SeatStatus;
import com.example.demo.module.cinema.entity.Hall;
import com.example.demo.module.cinema.entity.Seat;
import com.example.demo.module.cinema.repository.HallRepository;
import com.example.demo.module.cinema.repository.SeatRepository;
import com.example.demo.module.showtime.dto.request.CreateShowtimeRequest;
import com.example.demo.module.showtime.dto.request.ShowtimeSearchFilter;
import com.example.demo.module.showtime.dto.request.UpdateShowtimeRequest;
import com.example.demo.module.showtime.dto.response.ShowtimeDetailResponse;
import com.example.demo.module.showtime.dto.response.ShowtimeResponse;
import com.example.demo.module.showtime.entity.Showtime;
import com.example.demo.module.showtime.entity.ShowtimeSeat;
import com.example.demo.module.showtime.repository.ShowtimeRepository;
import com.example.demo.module.showtime.repository.ShowtimeSeatRepository;
import com.example.demo.module.showtime.service.ShowtimeService;
import com.example.demo.module.movie.entity.Movie;
import com.example.demo.module.movie.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeServiceImpl implements ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final MovieRepository movieRepository;
    private final HallRepository hallRepository;
    private final SeatRepository seatRepository;

    @Override
    @Transactional
    public ShowtimeResponse createShowtime(CreateShowtimeRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        boolean isOverlapped = showtimeRepository.existsOverlappingShowtime(
                request.getHallId(), request.getStartTime(), request.getEndTime());
        if (isOverlapped) {
            throw new IllegalStateException("Showtime overlaps with an existing showtime in this hall");
        }

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Movie not found with id: " + request.getMovieId()));

        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new RuntimeException("Hall not found with id: " + request.getHallId()));

        Showtime showtime = Showtime.builder()
                .movie(movie)
                .hall(hall)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .basePrice(request.getBasePrice())
                .build();

        Showtime savedShowtime = showtimeRepository.save(showtime);

        // Tự động sinh danh sách ShowtimeSeat theo toàn bộ ghế của Hall
        List<Seat> seatsInHall = seatRepository.findByHallId(hall.getId());
        List<ShowtimeSeat> showtimeSeats = seatsInHall.stream()
                .map(seat -> ShowtimeSeat.builder()
                        .showtime(savedShowtime)
                        .seat(seat)
                        .status(SeatStatus.AVAILABLE)
                        .build())
                .toList();

        showtimeSeatRepository.saveAll(showtimeSeats);

        return mapToResponse(savedShowtime);
    }

    @Override
    @Transactional(readOnly = true)
    public ShowtimeDetailResponse getShowtimeById(Long id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Showtime not found with id: " + id));

        int totalSeats = showtimeSeatRepository.countByShowtimeIdAndStatus(id, null); // Hoặc lấy qua hall
        int availableSeats = showtimeSeatRepository.countByShowtimeIdAndStatus(id, SeatStatus.AVAILABLE);

        return ShowtimeDetailResponse.builder()
                .id(showtime.getId())
                .movieId(showtime.getMovie().getId())
                .movieTitle(showtime.getMovie().getTitle())
                .hallId(showtime.getHall().getId())
                .hallName(showtime.getHall().getName())
                .startTime(showtime.getStartTime())
                .endTime(showtime.getEndTime())
                .basePrice(showtime.getBasePrice())
                .totalSeats(totalSeats)
                .availableSeats(availableSeats)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShowtimeResponse> searchShowtimes(ShowtimeSearchFilter filter) {
        LocalDateTime startOfDay = filter.getDate() != null ? filter.getDate().atStartOfDay() : null;
        LocalDateTime endOfDay = filter.getDate() != null ? filter.getDate().atTime(LocalTime.MAX) : null;

        List<Showtime> showtimes = showtimeRepository.searchShowtimes(
                filter.getMovieId(), filter.getCinemaId(), filter.getHallId(), startOfDay, endOfDay);

        return showtimes.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional
    public ShowtimeResponse updateShowtime(Long id, UpdateShowtimeRequest request) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Showtime not found with id: " + id));

        boolean isOverlapped = showtimeRepository.existsOverlappingShowtimeExcludingId(
                showtime.getHall().getId(), request.getStartTime(), request.getEndTime(), id);
        if (isOverlapped) {
            throw new IllegalStateException("Updated showtime overlaps with an existing showtime");
        }

        showtime.setStartTime(request.getStartTime());
        showtime.setEndTime(request.getEndTime());
        showtime.setBasePrice(request.getBasePrice());

        Showtime updatedShowtime = showtimeRepository.save(showtime);
        return mapToResponse(updatedShowtime);
    }

    @Override
    @Transactional
    public void deleteShowtime(Long id) {
        if (!showtimeRepository.existsById(id)) {
            throw new RuntimeException("Showtime not found with id: " + id);
        }
        showtimeRepository.deleteById(id);
    }

    private ShowtimeResponse mapToResponse(Showtime showtime) {
        return ShowtimeResponse.builder()
                .id(showtime.getId())
                .movieId(showtime.getMovie().getId())
                .movieTitle(showtime.getMovie().getTitle())
                .hallId(showtime.getHall().getId())
                .hallName(showtime.getHall().getName())
                .startTime(showtime.getStartTime())
                .endTime(showtime.getEndTime())
                .basePrice(showtime.getBasePrice())
                .build();
    }
}
