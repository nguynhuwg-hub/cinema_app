package com.example.demo.module.movie.service.impl;

import com.example.demo.module.movie.dto.request.GenreRequest;
import com.example.demo.module.movie.dto.response.GenreResponse;
import com.example.demo.module.movie.entity.Genre;
import com.example.demo.module.movie.repository.GenreRepository;
import com.example.demo.module.movie.service.GenreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements GenreService {

    private final GenreRepository genreRepository;

    @Override
    @Transactional
    public GenreResponse createGenre(GenreRequest request) {
        if (genreRepository.existsByName(request.getName())) {
            throw new RuntimeException("Genre name already exists: " + request.getName());
        }
        Genre genre = Genre.builder().name(request.getName()).build();
        return mapToResponse(genreRepository.save(genre));
    }

    @Override
    @Transactional(readOnly = true)
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GenreResponse updateGenre(Long id, GenreRequest request) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + id));

        if (!genre.getName().equalsIgnoreCase(request.getName()) && genreRepository.existsByName(request.getName())) {
            throw new RuntimeException("Genre name already exists: " + request.getName());
        }

        genre.setName(request.getName());
        return mapToResponse(genreRepository.save(genre));
    }

    @Override
    @Transactional
    public void deleteGenre(Long id) {
        if (!genreRepository.existsById(id)) {
            throw new RuntimeException("Genre not found with id: " + id);
        }
        genreRepository.deleteById(id);
    }

    private GenreResponse mapToResponse(Genre genre) {
        return GenreResponse.builder()
                .id(genre.getId())
                .name(genre.getName())
                .build();
    }
}
