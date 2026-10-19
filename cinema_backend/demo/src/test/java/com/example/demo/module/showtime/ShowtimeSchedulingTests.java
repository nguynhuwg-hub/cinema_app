package com.example.demo.module.showtime;

import com.example.demo.common.enums.SeatType;
import com.example.demo.entity.enums.MovieStatus;
import com.example.demo.module.cinema.entity.Cinema;
import com.example.demo.module.cinema.entity.City;
import com.example.demo.module.cinema.entity.Hall;
import com.example.demo.module.cinema.entity.Seat;
import com.example.demo.module.cinema.repository.CinemaRepository;
import com.example.demo.module.cinema.repository.CityRepository;
import com.example.demo.module.cinema.repository.HallRepository;
import com.example.demo.module.cinema.repository.SeatRepository;
import com.example.demo.module.movie.entity.Movie;
import com.example.demo.module.movie.dto.request.UpdateMovieRequest;
import com.example.demo.module.movie.repository.MovieRepository;
import com.example.demo.module.movie.service.MovieService;
import com.example.demo.module.showtime.dto.request.CreateShowtimeRequest;
import com.example.demo.module.showtime.dto.request.UpdateShowtimeRequest;
import com.example.demo.module.showtime.repository.ShowtimeRepository;
import com.example.demo.module.showtime.service.ShowtimeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ShowtimeSchedulingTests {

    @Autowired
    private ShowtimeService showtimeService;

    @Autowired
    private MovieService movieService;

    @Autowired
    private ShowtimeRepository showtimeRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private CinemaRepository cinemaRepository;

    @Autowired
    private HallRepository hallRepository;

    @Autowired
    private SeatRepository seatRepository;

    private Movie movie;
    private Hall firstHall;
    private Hall secondHall;
    private LocalDateTime firstStart;

    @BeforeEach
    void setUp() {
        City city = cityRepository.save(City.builder()
                .name("Test city")
                .build());
        Cinema cinema = cinemaRepository.save(Cinema.builder()
                .city(city)
                .name("Test cinema")
                .address("Test address")
                .build());
        firstHall = hallRepository.save(Hall.builder()
                .cinema(cinema)
                .name("Room 1")
                .totalSeats(1)
                .build());
        secondHall = hallRepository.save(Hall.builder()
                .cinema(cinema)
                .name("Room 2")
                .totalSeats(1)
                .build());
        movie = movieRepository.save(Movie.builder()
                .title("Test movie")
                .durationMinutes(120)
                .status(MovieStatus.NOW_SHOWING)
                .build());
        seatRepository.save(Seat.builder()
                .hall(firstHall)
                .seatRow("A")
                .seatNumber("1")
                .seatType(SeatType.NORMAL)
                .build());
        firstStart = LocalDateTime.now().plusDays(2).withSecond(0).withNano(0);
    }

    @Test
    void createsMultipleNonOverlappingShowtimesInSameHall() {
        var first = createShowtime(firstHall, firstStart);
        var secondStart = first.getEndTime();
        var second = createShowtime(firstHall, secondStart);
        var third = createShowtime(firstHall, second.getEndTime().plusMinutes(15));

        assertThat(showtimeRepository.count()).isEqualTo(3);
        assertThat(first.getEndTime()).isEqualTo(firstStart.plusMinutes(120));
        assertThat(second.getStartTime()).isEqualTo(first.getEndTime());
        assertThat(third.getStartTime()).isAfter(second.getEndTime());
    }

    @Test
    void rejectsOnlyShowtimesWhoseTimeRangesOverlapInSameHall() {
        createShowtime(firstHall, firstStart);

        assertThatThrownBy(() ->
                createShowtime(firstHall, firstStart.plusMinutes(119)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> {
                    var responseStatusException =
                            (ResponseStatusException) exception;
                    assertThat(responseStatusException.getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT);
                    assertThat(responseStatusException.getReason())
                            .contains("Room 1", "Test movie");
                });
    }

    @Test
    void allowsSameTimeInDifferentHalls() {
        createShowtime(firstHall, firstStart);

        var otherHallShowtime = createShowtime(secondHall, firstStart);

        assertThat(otherHallShowtime.getHallId()).isEqualTo(secondHall.getId());
        assertThat(showtimeRepository.count()).isEqualTo(2);
    }

    @Test
    void allowsSameTimeOnDifferentCalendarDaysInSameHall() {
        createShowtime(firstHall, firstStart);

        var nextDayShowtime = createShowtime(firstHall, firstStart.plusDays(1));

        assertThat(nextDayShowtime.getStartTime()).isEqualTo(firstStart.plusDays(1));
        assertThat(showtimeRepository.count()).isEqualTo(2);
    }

    @Test
    void rejectsInvalidMovieDurationWhenCreatingShowtime() {
        movie.setDurationMinutes(21600);
        movieRepository.save(movie);

        assertThatThrownBy(() -> createShowtime(firstHall, firstStart))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> {
                    var responseStatusException = (ResponseStatusException) exception;
                    assertThat(responseStatusException.getStatusCode())
                            .isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(responseStatusException.getReason())
                            .contains("1 đến 600 phút");
                });
    }

    @Test
    void correctingMovieDurationRecalculatesLegacyShowtimeEndTimes() {
        var existing = createShowtime(firstHall, firstStart);
        movie.setDurationMinutes(21600);
        movieRepository.save(movie);
        var persistedShowtime = showtimeRepository.findById(existing.getId()).orElseThrow();
        persistedShowtime.setEndTime(firstStart.plusMinutes(21600));
        showtimeRepository.save(persistedShowtime);

        movieService.updateMovie(
                movie.getId(),
                UpdateMovieRequest.builder().durationMinutes(120).build()
        );

        assertThat(showtimeRepository.findById(existing.getId()).orElseThrow().getEndTime())
                .isEqualTo(firstStart.plusMinutes(120));
        assertThat(createShowtime(firstHall, firstStart.plusDays(1)).getStartTime())
                .isEqualTo(firstStart.plusDays(1));
    }

    @Test
    void rejectsOverlapAcrossMidnightAndNamesTheConflictingShowtime() {
        createShowtime(firstHall, firstStart.plusDays(1).minusMinutes(60));

        assertThatThrownBy(() ->
                createShowtime(firstHall, firstStart.plusDays(1)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> {
                    var responseStatusException =
                            (ResponseStatusException) exception;
                    assertThat(responseStatusException.getStatusCode())
                            .isEqualTo(HttpStatus.CONFLICT);
                    assertThat(responseStatusException.getReason())
                            .contains("Room 1", "Test movie", firstStart.plusDays(1).toString());
                });
    }

    @Test
    void updatesShowtimeWithoutTreatingItselfAsAnOverlap() {
        var existing = createShowtime(firstHall, firstStart);
        var updatedStart = firstStart.plusHours(5);

        var updated = showtimeService.updateShowtime(
                existing.getId(),
                UpdateShowtimeRequest.builder()
                        .startTime(updatedStart)
                        .basePrice(new BigDecimal("90000.00"))
                        .build()
        );

        assertThat(updated.getStartTime()).isEqualTo(updatedStart);
        assertThat(updated.getEndTime()).isEqualTo(updatedStart.plusMinutes(120));
        assertThat(showtimeRepository.count()).isEqualTo(1);
    }

    @Test
    void rejectsUpdateThatOverlapsAnotherShowtime() {
        var existing = createShowtime(firstHall, firstStart);
        var later = createShowtime(firstHall, existing.getEndTime().plusMinutes(30));

        assertThatThrownBy(() -> showtimeService.updateShowtime(
                later.getId(),
                UpdateShowtimeRequest.builder()
                        .startTime(firstStart.plusMinutes(60))
                        .basePrice(new BigDecimal("90000.00"))
                        .build()
        )).isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(
                        ((ResponseStatusException) exception).getStatusCode()
                ).isEqualTo(HttpStatus.CONFLICT));
    }

    private com.example.demo.module.showtime.dto.response.ShowtimeResponse createShowtime(
            Hall hall,
            LocalDateTime startTime
    ) {
        return showtimeService.createShowtime(CreateShowtimeRequest.builder()
                .movieId(movie.getId())
                .hallId(hall.getId())
                .startTime(startTime)
                .basePrice(new BigDecimal("80000.00"))
                .build());
    }
}
