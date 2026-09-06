package com.example.demo.module.movie.dto.request;

import com.example.demo.entity.enums.MovieStatus;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMovieRequest {

    private String title;
    private String description;

    @Min(value = 1, message = "Thời lượng phim phải lớn hơn 0")
    private Integer durationMinutes;

    private LocalDate releaseDate;
    private String posterUrl;
    private String trailerUrl;
    private String language;
    private MovieStatus status;
    private Set<Long> genreIds;
}
