package com.example.demo.module.movie.dto.response;

import com.example.demo.entity.enums.MovieStatus;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieResponse {

    private Long id;
    private String title;
    private Integer durationMinutes;
    private LocalDate releaseDate;
    private String posterUrl;
    private MovieStatus status;
    private Float avgRating;
}
