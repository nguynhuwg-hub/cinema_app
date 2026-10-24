
package com.example.demo.module.showtime.service.impl;

import com.example.demo.entity.enums.SeatStatus;
import com.example.demo.module.booking.repository.BookingRepository;
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
import com.example.demo.module.movie.repository.MovieRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeServiceImpl implements ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final MovieRepository movieRepository;
    private final HallRepository hallRepository;
    private final SeatRepository seatRepository;
    private final BookingRepository bookingRepository;

    @Override
    @Transactional
    public ShowtimeResponse createShowtime(CreateShowtimeRequest request) {
        Hall hall = hallRepository.findByIdForShowtimeCreation(request.getHallId())
                .orElseThrow(() -> new RuntimeException(
                        "Hall not found with id: " + request.getHallId()
                ));

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException(
                        "Movie not found with id: " + request.getMovieId()
                ));

        LocalDateTime endTime = calculateEndTime(request.getStartTime(), movie);

        List<Showtime> overlappingShowtimes =
                showtimeRepository.findOverlappingShowtimes(
                        hall.getId(), request.getStartTime(), endTime
                );

        if (!overlappingShowtimes.isEmpty()) {
            String conflictingShowtimes = overlappingShowtimes.stream()
                    .map(existing -> String.format(
                            "#%d %s (%d phút, %s – %s)",
                            existing.getId(),
                            existing.getMovie().getTitle(),
                            existing.getMovie().getDurationMinutes(),
                            existing.getStartTime(),
                            existing.getEndTime()
                    ))
                    .collect(java.util.stream.Collectors.joining(", "));

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    String.format(
                            " %s bị trùng lịch. Suất yêu cầu: %s – %s. Suất đang xung đột: %s",
                            hall.getName(),
                            request.getStartTime(),
                            endTime,
                            conflictingShowtimes
                    )
            );
        }

        Showtime showtime = Showtime.builder()
                .movie(movie)
                .hall(hall)
                .startTime(request.getStartTime())
                .endTime(endTime)
                .basePrice(request.getBasePrice())
                .build();

        Showtime savedShowtime =
                showtimeRepository.save(showtime);

        // Tạo ghế suất chiếu từ danh sách ghế của phòng.
        List<Seat> seatsInHall =
                seatRepository.findByHallId(hall.getId());

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
                .orElseThrow(() -> new RuntimeException(
                        "Showtime not found with id: " + id
                ));

        int totalSeats =
                showtimeSeatRepository.countByShowtimeId(id);

        int availableSeats =
                showtimeSeatRepository.countByShowtimeIdAndStatus(
                        id,
                        SeatStatus.AVAILABLE
                );

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
    public List<ShowtimeResponse> searchShowtimes(
            ShowtimeSearchFilter filter
    ) {
        LocalDate startDate = filter.getStartDate() != null
                ? filter.getStartDate()
                : filter.getDate();

        LocalDate endDate = filter.getEndDate() != null
                ? filter.getEndDate()
                : filter.getDate();

        if (startDate != null
                && endDate != null
                && startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "Showtime start date must not be after end date"
            );
        }

        LocalDateTime startOfRange = startDate == null
                ? null
                : startDate.atStartOfDay();

        LocalDateTime endExclusive = endDate == null
                ? null
                : endDate.plusDays(1).atStartOfDay();

        List<Showtime> showtimes =
                showtimeRepository.searchShowtimes(
                        filter.getMovieId(),
                        filter.getCinemaId(),
                        filter.getHallId(),
                        startOfRange,
                        endExclusive,
                        LocalDateTime.now()
                );

        return showtimes.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public ShowtimeResponse updateShowtime(
            Long id,
            UpdateShowtimeRequest request
    ) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Showtime not found with id: " + id
                ));

        LocalDateTime endTime =
                calculateEndTime(request.getStartTime(), showtime.getMovie());

        List<Showtime> overlappingShowtimes =
                showtimeRepository.findOverlappingShowtimesExcludingId(
                        showtime.getHall().getId(),
                        request.getStartTime(),
                        endTime,
                        id
                );

        if (!overlappingShowtimes.isEmpty()) {
            String conflictingShowtimes = overlappingShowtimes.stream()
                    .map(existing -> String.format(
                            "#%d %s (%d phút, %s – %s)",
                            existing.getId(),
                            existing.getMovie().getTitle(),
                            existing.getMovie().getDurationMinutes(),
                            existing.getStartTime(),
                            existing.getEndTime()
                    ))
                    .collect(java.util.stream.Collectors.joining(", "));

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    String.format(
                            "Giờ cập nhật bị trùng với suất chiếu: %s",
                            conflictingShowtimes
                    )
            );
        }

        showtime.setStartTime(request.getStartTime());
        showtime.setEndTime(endTime);
        showtime.setBasePrice(request.getBasePrice());

        Showtime updatedShowtime =
                showtimeRepository.save(showtime);

        return mapToResponse(updatedShowtime);
    }

    private LocalDateTime calculateEndTime(
            LocalDateTime startTime,
            Movie movie
    ) {
        Integer durationMinutes = movie.getDurationMinutes();

        if (durationMinutes == null
                || durationMinutes <= 0
                || durationMinutes > 600) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thời lượng phim không hợp lệ (phải từ 1 đến 600 phút). "
                    + "Hãy sửa thời lượng phim trước khi tạo suất."
            );
        }

        return startTime.plusMinutes(durationMinutes);
    }

    /**
     * Xóa suất chiếu:
     * - 404 nếu không tồn tại.
     * - 409 nếu đã phát sinh Booking.
     * - Các ràng buộc dữ liệu khác vẫn được database bảo vệ.
     */
    @Override
    @Transactional
    public void deleteShowtime(Long id) {

        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy suất chiếu có ID: " + id
                ));

        // Giữ lịch sử đặt vé, kể cả đơn đã hủy hoặc hết hạn.
        if (bookingRepository.existsByShowtimeId(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa suất chiếu vì đã có đơn đặt vé. "
                    + "Cần giữ lại lịch sử đặt vé và thanh toán."
            );
        }

        // Chưa tự động xóa ShowtimeSeat khi chưa kiểm tra
        // các quan hệ entity và ràng buộc khóa ngoại.
        showtimeRepository.delete(showtime);
        showtimeRepository.flush();
    }

    private ShowtimeResponse mapToResponse(Showtime showtime) {
        return ShowtimeResponse.builder()
                .id(showtime.getId())
                .movieId(showtime.getMovie().getId())
                .movieTitle(showtime.getMovie().getTitle())
                .movieDescription(showtime.getMovie().getDescription())
                .movieDurationMinutes(showtime.getMovie().getDurationMinutes())
                .movieReleaseDate(showtime.getMovie().getReleaseDate())
                .moviePosterUrl(showtime.getMovie().getPosterUrl())
                .movieTrailerUrl(showtime.getMovie().getTrailerUrl())
                .movieLanguage(showtime.getMovie().getLanguage())
                .movieStatus(showtime.getMovie().getStatus() == null
                        ? null
                        : showtime.getMovie().getStatus().name())
                .movieAvgRating(showtime.getMovie().getAvgRating())
                .movieGenres(showtime.getMovie().getGenres() == null
                        ? List.of()
                        : showtime.getMovie().getGenres().stream()
                            .map(genre -> genre.getName())
                            .sorted()
                            .toList())
                .hallId(showtime.getHall().getId())
                .hallName(showtime.getHall().getName())
                .startTime(showtime.getStartTime())
                .endTime(showtime.getEndTime())
                .basePrice(showtime.getBasePrice())
                .build();
    }
}
