package com.example.demo.concession.repository;

import com.example.demo.entity.Concession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConcessionRepository extends JpaRepository<Concession, Long> {
    // Lấy danh sách các món đang bán (isActive = true) cho khách hàng
    List<Concession> findByIsActiveTrue();
}