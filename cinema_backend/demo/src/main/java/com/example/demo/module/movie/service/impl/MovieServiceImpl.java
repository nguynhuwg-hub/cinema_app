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
import com.example.demo.module.showtime.entity.Showtime;
import com.example.demo.module.showtime.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    private final ShowtimeRepository showtimeRepository;

    @Override
    @Transactional
    public MovieDetailResponse createMovie(CreateMovieRequest request) {
        validateDuration(request.getDurationMinutes());
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
        if (request.getDurationMinutes() != null
                && !request.getDurationMinutes().equals(movie.getDurationMinutes())) {
            validateDuration(request.getDurationMinutes());
            updateShowtimeEndTimes(movie, request.getDurationMinutes());
            movie.setDurationMinutes(request.getDurationMinutes());
        }
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

    private void updateShowtimeEndTimes(Movie movie, int durationMinutes) {
        List<Showtime> movieShowtimes =
                showtimeRepository.findByMovieIdForDurationUpdate(movie.getId());

        for (Showtime showtime : movieShowtimes) {
            var correctedEndTime =
                    showtime.getStartTime().plusMinutes(durationMinutes);
            List<Showtime> overlapping = showtimeRepository
                    .findOverlappingShowtimesExcludingId(
                            showtime.getHall().getId(),
                            showtime.getStartTime(),
                            correctedEndTime,
                            showtime.getId()
                    );
            if (!overlapping.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        String.format(
                                "Không thể đổi thời lượng phim vì suất #%d trong phòng %s sẽ trùng với suất #%d.",
                                showtime.getId(),
                                showtime.getHall().getName(),
                                overlapping.get(0).getId()
                        )
                );
            }
            showtime.setEndTime(correctedEndTime);
        }
    }

    private void validateDuration(Integer durationMinutes) {
        if (durationMinutes == null || durationMinutes < 1 || durationMinutes > 600) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Thời lượng phim phải từ 1 đến 600 phút."
            );
        }
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
