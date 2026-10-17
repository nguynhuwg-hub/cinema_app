package com.example.demo.module.movie.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Integer rating;
    private String content;
    private LocalDateTime createdAt;
    private List<CommentResponse> replies;
}