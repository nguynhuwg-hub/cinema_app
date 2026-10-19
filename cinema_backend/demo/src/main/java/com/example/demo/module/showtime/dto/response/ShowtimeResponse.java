package com.example.demo.module.showtime.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShowtimeResponse {

    private Long id;
    private Long movieId;
    private String movieTitle;
    private String movieDescription;
    private Integer movieDurationMinutes;
    private LocalDate movieReleaseDate;
    private String moviePosterUrl;
    private String movieTrailerUrl;
    private String movieLanguage;
    private String movieStatus;
    private Float movieAvgRating;
    private List<String> movieGenres;
    private Long hallId;
    private String hallName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal basePrice;
}