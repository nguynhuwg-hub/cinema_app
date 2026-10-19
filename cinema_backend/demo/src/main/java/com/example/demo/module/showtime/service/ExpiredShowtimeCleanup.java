package com.example.demo.module.showtime.service;

import com.example.demo.module.showtime.entity.Showtime;
import com.example.demo.module.showtime.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ExpiredShowtimeCleanup {

    private final ShowtimeRepository showtimeRepository;

    @Scheduled(fixedDelayString = "${app.showtime.cleanup-check-ms:900000}")
    @Transactional
    public void deleteExpiredUnbookedShowtimes() {
        List<Showtime> expiredShowtimes =
                showtimeRepository.findExpiredShowtimesWithoutBookings(
                        LocalDateTime.now()
                );
        showtimeRepository.deleteAll(expiredShowtimes);
    }
}
