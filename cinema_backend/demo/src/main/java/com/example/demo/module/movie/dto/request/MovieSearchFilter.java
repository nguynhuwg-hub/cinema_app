package com.example.demo.module.movie.dto.request;

import com.example.demo.entity.enums.MovieStatus;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieSearchFilter {

    private String keyword;
    private Long genreId;
    private MovieStatus status;
}
