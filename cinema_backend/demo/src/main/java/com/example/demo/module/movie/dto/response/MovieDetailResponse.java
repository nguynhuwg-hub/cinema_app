package com.example.demo.module.movie.dto.response;

import com.example.demo.entity.enums.MovieStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieDetailResponse {

    private Long id;
    private String title;
    private String description;
    private Integer durationMinutes;
    private LocalDate releaseDate;
    private String posterUrl;
    private String trailerUrl;
    private String language;
    private MovieStatus status;
    private Float avgRating;
    private Set<GenreResponse> genres;
}
