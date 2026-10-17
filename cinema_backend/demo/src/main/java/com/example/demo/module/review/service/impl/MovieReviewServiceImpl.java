package com.example.demo.module.review.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.module.movie.entity.Movie;
import com.example.demo.module.movie.repository.MovieRepository;
import com.example.demo.module.review.dto.MovieReviewRequest;
import com.example.demo.module.review.dto.MovieReviewResponse;
import com.example.demo.module.review.entity.MovieReview;
import com.example.demo.module.review.repository.MovieReviewRepository;
import com.example.demo.module.review.service.MovieReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieReviewServiceImpl implements MovieReviewService {

    private final MovieReviewRepository reviewRepository;
    private final MovieRepository movieRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MovieReviewResponse> getAllReviews() {
        return reviewRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovieReviewResponse> getReviewsByMovie(Long movieId) {
        if (!movieRepository.existsById(movieId)) {
            throw new ResourceNotFoundException("Không tìm thấy phim với ID: " + movieId);
        }
        return reviewRepository.findByMovie_IdOrderByCreatedAtDesc(movieId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MovieReviewResponse getReview(Long id) {
        return toResponse(findReview(id));
    }

    @Override
    @Transactional
    public MovieReviewResponse createReview(MovieReviewRequest request) {
        MovieReview review = new MovieReview();
        updateReviewFields(review, request);
        return toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public MovieReviewResponse updateReview(Long id, MovieReviewRequest request) {
        MovieReview review = findReview(id);
        updateReviewFields(review, request);
        return toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public void deleteReview(Long id) {
        reviewRepository.delete(findReview(id));
    }

    private MovieReview findReview(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đánh giá với ID: " + id));
    }

    private void updateReviewFields(MovieReview review, MovieReviewRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim với ID: " + request.getMovieId()));

        review.setMovie(movie);
        review.setCategory(request.getCategory().trim());
        review.setTitle(request.getTitle().trim());
        review.setExcerpt(request.getExcerpt().trim());
        review.setContent(request.getContent().trim());
        review.setAuthorName(request.getAuthorName().trim());
        review.setAuthorRole(request.getAuthorRole().trim());
        review.setRating(request.getRating());
    }

    private MovieReviewResponse toResponse(MovieReview review) {
        return MovieReviewResponse.builder()
                .id(review.getId())
                .movieId(review.getMovie().getId())
                .movieTitle(review.getMovie().getTitle())
                .category(review.getCategory())
                .title(review.getTitle())
                .excerpt(review.getExcerpt())
                .content(review.getContent())
                .authorName(review.getAuthorName())
                .authorRole(review.getAuthorRole())
                .rating(review.getRating())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
