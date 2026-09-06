package com.example.demo.module.movie.service;

import com.example.demo.module.movie.dto.request.CreateCommentRequest;
import com.example.demo.module.movie.dto.response.CommentResponse;

import java.util.List;

public interface CommentService {
    CommentResponse createComment(Long movieId, CreateCommentRequest request);
    List<CommentResponse> getCommentsByMovieId(Long movieId);
    void deleteComment(Long commentId);
}
