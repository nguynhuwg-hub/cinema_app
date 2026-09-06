package com.example.demo.module.movie.repository;

import com.example.demo.entity.enums.MovieStatus;
import com.example.demo.module.movie.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {

    @Query("SELECT DISTINCT m FROM Movie m " +
           "LEFT JOIN m.genres g " +
           "WHERE (:keyword IS NULL OR LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:genreId IS NULL OR g.id = :genreId) " +
           "AND (:status IS NULL OR m.status = :status)")
    List<Movie> searchMovies(@Param("keyword") String keyword,
                             @Param("genreId") Long genreId,
                             @Param("status") MovieStatus status);
}
