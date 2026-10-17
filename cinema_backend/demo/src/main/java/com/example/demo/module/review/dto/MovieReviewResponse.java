package com.example.demo.module.review.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieReviewResponse {
    private Long id;
    private Long movieId;
    private String movieTitle;
    private String category;
    private String title;
    private String excerpt;
    private String content;
    private String authorName;
    private String authorRole;
    private Float rating;
    private LocalDateTime createdAt;
}
