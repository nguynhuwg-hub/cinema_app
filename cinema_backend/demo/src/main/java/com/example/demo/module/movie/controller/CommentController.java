package com.example.demo.module.movie.controller;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.module.movie.dto.request.CreateCommentRequest;
import com.example.demo.module.movie.dto.response.CommentResponse;
import com.example.demo.module.movie.entity.Comment;
import com.example.demo.module.movie.repository.CommentRepository;
import com.example.demo.module.movie.service.CommentService;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/movies/{movieId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAuthority('COMMENT_CREATE')")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long movieId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        // Không dùng userId do client tự chọn.
        request.setUserId(user.getId());

        if (request.getParentCommentId() != null) {
            Comment parent = findComment(request.getParentCommentId());

            if (!Objects.equals(parent.getMovie().getId(), movieId)) {
                throw new ResourceNotFoundException(
                        "Bình luận cha không thuộc phim này");
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.createComment(movieId, request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('COMMENT_READ')")
    public ResponseEntity<List<CommentResponse>> getCommentsByMovie(
            @PathVariable Long movieId) {
        return ResponseEntity.ok(
                commentService.getCommentsByMovieId(movieId));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("""
        hasAnyAuthority('COMMENT_DELETE_OWN', 'COMMENT_DELETE_ANY')
        """)
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long movieId,
            @PathVariable Long commentId,
            Authentication authentication) {

        Comment comment = findComment(commentId);

        if (!Objects.equals(comment.getMovie().getId(), movieId)) {
            throw new ResourceNotFoundException(
                    "Bình luận không thuộc phim này");
        }

        boolean canDeleteAny = authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        "COMMENT_DELETE_ANY".equals(authority.getAuthority()));

        if (!canDeleteAny) {
            User user = getCurrentUser(authentication);

            if (!Objects.equals(comment.getUser().getId(), user.getId())) {
                throw new AccessDeniedException(
                        "Bạn chỉ được xóa bình luận của mình");
            }
        }

        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }

    private Comment findComment(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy bình luận với ID: " + id));
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException(
                        "Không tìm thấy tài khoản đăng nhập"));
    }
}