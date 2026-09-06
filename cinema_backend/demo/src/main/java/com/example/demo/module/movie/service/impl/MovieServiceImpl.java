package com.example.demo.module.movie.service.impl;

import com.example.demo.module.movie.dto.request.CreateMovieRequest;
import com.example.demo.module.movie.dto.request.MovieSearchFilter;
import com.example.demo.module.movie.dto.request.UpdateMovieRequest;
import com.example.demo.module.movie.dto.response.GenreResponse;
import com.example.demo.module.movie.dto.response.MovieDetailResponse;
import com.example.demo.module.movie.dto.response.MovieResponse;
import com.example.demo.module.movie.entity.Genre;
import com.example.demo.module.movie.entity.Movie;
import com.example.demo.module.movie.repository.GenreRepository;
import com.example.demo.module.movie.repository.MovieRepository;
import com.example.demo.module.movie.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;

    @Override
    @Transactional
    public MovieDetailResponse createMovie(CreateMovieRequest request) {
        Set<Genre> genres = new HashSet<>();
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            genres = new HashSet<>(genreRepository.findAllById(request.getGenreIds()));
        }

        Movie movie = Movie.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .releaseDate(request.getReleaseDate())
                .posterUrl(request.getPosterUrl())
                .trailerUrl(request.getTrailerUrl())
                .language(request.getLanguage())
                .status(request.getStatus())
                .avgRating(0.0f)
                .genres(genres)
                .build();

        return mapToDetailResponse(movieRepository.save(movie));
    }

    @Override
    @Transactional(readOnly = true)
    public MovieDetailResponse getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found with id: " + id));
        return mapToDetailResponse(movie);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovieResponse> searchMovies(MovieSearchFilter filter) {
        List<Movie> movies = movieRepository.searchMovies(
                filter.getKeyword(),
                filter.getGenreId(),
                filter.getStatus()
        );
        return movies.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MovieDetailResponse updateMovie(Long id, UpdateMovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found with id: " + id));

        if (request.getTitle() != null) movie.setTitle(request.getTitle());
        if (request.getDescription() != null) movie.setDescription(request.getDescription());
        if (request.getDurationMinutes() != null) movie.setDurationMinutes(request.getDurationMinutes());
        if (request.getReleaseDate() != null) movie.setReleaseDate(request.getReleaseDate());
        if (request.getPosterUrl() != null) movie.setPosterUrl(request.getPosterUrl());
        if (request.getTrailerUrl() != null) movie.setTrailerUrl(request.getTrailerUrl());
        if (request.getLanguage() != null) movie.setLanguage(request.getLanguage());
        if (request.getStatus() != null) movie.setStatus(request.getStatus());

        if (request.getGenreIds() != null) {
            Set<Genre> genres = new HashSet<>(genreRepository.findAllById(request.getGenreIds()));
            movie.setGenres(genres);
        }

        return mapToDetailResponse(movieRepository.save(movie));
    }

    @Override
    @Transactional
    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new RuntimeException("Movie not found with id: " + id);
        }
        movieRepository.deleteById(id);
    }

    private MovieResponse mapToResponse(Movie movie) {
        return MovieResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .durationMinutes(movie.getDurationMinutes())
                .releaseDate(movie.getReleaseDate())
                .posterUrl(movie.getPosterUrl())
                .status(movie.getStatus())
                .avgRating(movie.getAvgRating())
                .build();
    }

    private MovieDetailResponse mapToDetailResponse(Movie movie) {
        Set<GenreResponse> genreResponses = movie.getGenres() != null ?
                movie.getGenres().stream()
                        .map(g -> GenreResponse.builder().id(g.getId()).name(g.getName()).build())
                        .collect(Collectors.toSet()) : new HashSet<>();

        return MovieDetailResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .description(movie.getDescription())
                .durationMinutes(movie.getDurationMinutes())
                .releaseDate(movie.getReleaseDate())
                .posterUrl(movie.getPosterUrl())
                .trailerUrl(movie.getTrailerUrl())
                .language(movie.getLanguage())
                .status(movie.getStatus())
                .avgRating(movie.getAvgRating())
                .genres(genreResponses)
                .build();
    }
}
