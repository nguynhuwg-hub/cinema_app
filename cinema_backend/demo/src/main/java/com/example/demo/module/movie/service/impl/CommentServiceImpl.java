package com.example.demo.module.movie.service.impl;

import com.example.demo.module.movie.dto.request.CreateCommentRequest;
import com.example.demo.module.movie.dto.response.CommentResponse;
import com.example.demo.module.movie.entity.Comment;
import com.example.demo.module.movie.entity.Movie;
import com.example.demo.module.movie.repository.CommentRepository;
import com.example.demo.module.movie.repository.MovieRepository;
import com.example.demo.module.movie.service.CommentService;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public CommentResponse createComment(Long movieId, CreateCommentRequest request) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found with id: " + movieId));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getUserId()));

        Comment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found with id: " + request.getParentCommentId()));
        }

        Comment comment = Comment.builder()
                .movie(movie)
                .user(user)
                .parentComment(parentComment)
                .rating(request.getRating())
                .content(request.getContent())
                .build();

        Comment savedComment = commentRepository.save(comment);

        // Tự động tính lại điểm đánh giá trung bình cho Movie nếu có rating
        if (request.getRating() != null) {
            Double newAvgRating = commentRepository.calculateAverageRatingByMovieId(movieId);
            if (newAvgRating != null) {
                movie.setAvgRating((float) Math.round(newAvgRating * 10) / 10);
                movieRepository.save(movie);
            }
        }

        return mapToResponse(savedComment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByMovieId(Long movieId) {
        if (!movieRepository.existsById(movieId)) {
            throw new RuntimeException("Movie not found with id: " + movieId);
        }

        List<Comment> rootComments = commentRepository.findByMovieIdAndParentCommentIsNullOrderByCreatedAtDesc(movieId);
        return rootComments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        Long movieId = comment.getMovie().getId();
        commentRepository.delete(comment);

        // Tính lại avgRating sau khi xóa comment
        Double newAvgRating = commentRepository.calculateAverageRatingByMovieId(movieId);
        Movie movie = comment.getMovie();
        movie.setAvgRating(newAvgRating != null ? (float) Math.round(newAvgRating * 10) / 10 : 0.0f);
        movieRepository.save(movie);
    }

    private CommentResponse mapToResponse(Comment comment) {
        List<CommentResponse> replyResponses = new ArrayList<>();
        if (comment.getReplies() != null && !comment.getReplies().isEmpty()) {
            replyResponses = comment.getReplies().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }

        return CommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getFullName()) // Giả định User entity có phương thức getUsername()
                .rating(comment.getRating())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .replies(replyResponses)
                .build();
    }
}
