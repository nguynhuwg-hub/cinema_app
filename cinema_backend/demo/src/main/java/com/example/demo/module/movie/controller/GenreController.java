package com.example.demo.module.movie.controller;

import com.example.demo.module.movie.dto.request.GenreRequest;
import com.example.demo.module.movie.dto.response.GenreResponse;
import com.example.demo.module.movie.service.GenreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreService genreService;

    @PostMapping
    @PreAuthorize("hasAuthority('GENRE_CREATE')")
    public ResponseEntity<GenreResponse> createGenre(
            @Valid @RequestBody GenreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(genreService.createGenre(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GENRE_READ')")
    public ResponseEntity<List<GenreResponse>> getAllGenres() {
        return ResponseEntity.ok(genreService.getAllGenres());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GENRE_UPDATE')")
    public ResponseEntity<GenreResponse> updateGenre(
            @PathVariable Long id,
            @Valid @RequestBody GenreRequest request) {
        return ResponseEntity.ok(genreService.updateGenre(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('GENRE_DELETE')")
    public ResponseEntity<Void> deleteGenre(@PathVariable Long id) {
        genreService.deleteGenre(id);
        return ResponseEntity.noContent().build();
    }
}