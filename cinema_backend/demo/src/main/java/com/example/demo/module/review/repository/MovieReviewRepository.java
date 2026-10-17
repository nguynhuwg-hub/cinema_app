package com.example.demo.module.review.repository;

import com.example.demo.module.review.entity.MovieReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovieReviewRepository extends JpaRepository<MovieReview, Long> {
    List<MovieReview> findAllByOrderByCreatedAtDesc();
    List<MovieReview> findByMovie_IdOrderByCreatedAtDesc(Long movieId);
}
