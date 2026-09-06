package com.example.demo.module.movie.controller;

import com.example.demo.module.movie.dto.request.CreateCommentRequest;
import com.example.demo.module.movie.dto.response.CommentResponse;
import com.example.demo.module.movie.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/movies/{movieId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long movieId,
            @Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.createComment(movieId, request));
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getCommentsByMovie(@PathVariable Long movieId) {
        return ResponseEntity.ok(commentService.getCommentsByMovieId(movieId));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long movieId, @PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}