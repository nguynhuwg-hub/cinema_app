package com.example.demo.module.review.service;

import com.example.demo.module.review.dto.MovieReviewRequest;
import com.example.demo.module.review.dto.MovieReviewResponse;

import java.util.List;

public interface MovieReviewService {
    List<MovieReviewResponse> getAllReviews();
    List<MovieReviewResponse> getReviewsByMovie(Long movieId);
    MovieReviewResponse getReview(Long id);
    MovieReviewResponse createReview(MovieReviewRequest request);
    MovieReviewResponse updateReview(Long id, MovieReviewRequest request);
    void deleteReview(Long id);
}
