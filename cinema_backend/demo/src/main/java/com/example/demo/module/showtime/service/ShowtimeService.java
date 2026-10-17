package com.example.demo.module.showtime.service;


import com.example.demo.module.showtime.dto.request.CreateShowtimeRequest;
import com.example.demo.module.showtime.dto.request.ShowtimeSearchFilter;
import com.example.demo.module.showtime.dto.request.UpdateShowtimeRequest;
import com.example.demo.module.showtime.dto.response.ShowtimeDetailResponse;
import com.example.demo.module.showtime.dto.response.ShowtimeResponse;

import java.util.List;

public interface ShowtimeService {
    ShowtimeResponse createShowtime(CreateShowtimeRequest request);
    ShowtimeDetailResponse getShowtimeById(Long id);
    List<ShowtimeResponse> searchShowtimes(ShowtimeSearchFilter filter);
    ShowtimeResponse updateShowtime(Long id, UpdateShowtimeRequest request);
    void deleteShowtime(Long id);
}
