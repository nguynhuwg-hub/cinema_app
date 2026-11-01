package com.example.demo.module.cinema.repository;

import com.example.demo.module.cinema.entity.Hall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HallRepository extends JpaRepository<Hall, Long> {
    List<Hall> findByCinemaId(Long cinemaId);
}
