package com.example.demo.module.review.controller;

import com.example.demo.module.review.dto.MovieReviewRequest;
import com.example.demo.module.review.dto.MovieReviewResponse;
import com.example.demo.module.review.service.MovieReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class MovieReviewController {

    private final MovieReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<MovieReviewResponse>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<MovieReviewResponse>> getReviewsByMovie(@PathVariable Long movieId) {
        return ResponseEntity.ok(reviewService.getReviewsByMovie(movieId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieReviewResponse> getReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReview(id));
    }

    @PostMapping("/admin")
@PreAuthorize("hasRole('MANAGER')")
public ResponseEntity<MovieReviewResponse> createReview(
        @Valid @RequestBody MovieReviewRequest request) {

    return ResponseEntity.status(HttpStatus.CREATED)
            .body(reviewService.createReview(request));
}

   @PutMapping("/admin/{id}")
@PreAuthorize("hasRole('MANAGER')")
public ResponseEntity<MovieReviewResponse> updateReview(
        @PathVariable Long id,
        @Valid @RequestBody MovieReviewRequest request) {

    return ResponseEntity.ok(
            reviewService.updateReview(id, request)
    );
}

   @DeleteMapping("/admin/{id}")
@PreAuthorize("hasRole('MANAGER')")
public ResponseEntity<Void> deleteReview(
        @PathVariable Long id) {

    reviewService.deleteReview(id);

    return ResponseEntity.noContent().build();
}
}
