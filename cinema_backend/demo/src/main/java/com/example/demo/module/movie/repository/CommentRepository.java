package com.example.demo.module.movie.repository;

import com.example.demo.module.movie.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // Chỉ lấy các bình luận gốc (không có parent) của một phim, đã bao gồm danh sách replies bên trong
    List<Comment> findByMovieIdAndParentCommentIsNullOrderByCreatedAtDesc(Long movieId);

    // Tính điểm đánh giá trung bình từ tất cả các comment có rating của phim
    @Query("SELECT AVG(c.rating) FROM Comment c WHERE c.movie.id = :movieId AND c.rating IS NOT NULL")
    Double calculateAverageRatingByMovieId(@Param("movieId") Long movieId);
}
