package com.example.demo.module.movie.service;

import com.example.demo.module.movie.dto.request.GenreRequest;
import com.example.demo.module.movie.dto.response.GenreResponse;

import java.util.List;

public interface GenreService {
    GenreResponse createGenre(GenreRequest request);
    List<GenreResponse> getAllGenres();
    GenreResponse updateGenre(Long id, GenreRequest request);
    void deleteGenre(Long id);
}
