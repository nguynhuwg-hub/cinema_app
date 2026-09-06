package com.example.demo.module.movie.service;

import com.example.demo.module.movie.dto.request.CreateMovieRequest;
import com.example.demo.module.movie.dto.request.MovieSearchFilter;
import com.example.demo.module.movie.dto.request.UpdateMovieRequest;
import com.example.demo.module.movie.dto.response.MovieDetailResponse;
import com.example.demo.module.movie.dto.response.MovieResponse;

import java.util.List;

public interface MovieService {
    MovieDetailResponse createMovie(CreateMovieRequest request);
    MovieDetailResponse getMovieById(Long id);
    List<MovieResponse> searchMovies(MovieSearchFilter filter);
    MovieDetailResponse updateMovie(Long id, UpdateMovieRequest request);
    void deleteMovie(Long id);
}
