package com.example.demo.module.movie.dto.request;

import com.example.demo.entity.enums.MovieStatus;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMovieRequest {

    @NotBlank(message = "Tên phim không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Thời lượng phim không được để trống")
    @Min(value = 1, message = "Thời lượng phim phải lớn hơn 0")
    private Integer durationMinutes;

    private LocalDate releaseDate;
    private String posterUrl;
    private String trailerUrl;
    private String language;

    @NotNull(message = "Trạng thái phim không được để trống")
    private MovieStatus status;

    private Set<Long> genreIds;
}