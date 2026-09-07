package com.example.demo.module.user.repository;

import com.example.demo.common.enums.AccountStatus;
import com.example.demo.module.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Eager load roles và city để tránh N+1 Query khi lấy thông tin user
    @EntityGraph(attributePaths = {"roles", "city"})
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @EntityGraph(attributePaths = {"roles", "city"})
    Page<User> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"roles", "city"})
    Page<User> findByStatus(AccountStatus status, Pageable pageable);
}