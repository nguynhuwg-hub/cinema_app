package com.example.demo.module.showtime.controller;

import com.example.demo.entity.enums.SeatStatus;
import com.example.demo.module.showtime.dto.request.UpdateSeatStatusRequest;
import com.example.demo.module.showtime.dto.response.SeatLayoutResponse;
import com.example.demo.module.showtime.dto.response.ShowtimeSeatResponse;
import com.example.demo.module.showtime.entity.ShowtimeSeat;
import com.example.demo.module.showtime.repository.ShowtimeSeatRepository;
import com.example.demo.module.showtime.service.ShowtimeSeatService;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/showtimes/{showtimeId}/seats")
@RequiredArgsConstructor
public class ShowtimeSeatController {

    private final ShowtimeSeatService showtimeSeatService;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('SHOWTIME_SEAT_READ')")
    public ResponseEntity<SeatLayoutResponse> getSeatLayout(
            @PathVariable Long showtimeId) {
        return ResponseEntity.ok(
                showtimeSeatService.getSeatLayoutByShowtimeId(showtimeId));
    }

    @PatchMapping("/status")
    @PreAuthorize("""
        hasAnyAuthority(
            'SHOWTIME_SEAT_HOLD_OWN',
            'SHOWTIME_SEAT_RELEASE_OWN',
            'SHOWTIME_SEAT_MANAGE'
        )
        """)
    @Transactional
    public ResponseEntity<List<ShowtimeSeatResponse>> updateSeatStatus(
            @PathVariable Long showtimeId,
            @Valid @RequestBody UpdateSeatStatusRequest request,
            Authentication authentication) {

        boolean canManage = hasAuthority(
                authentication, "SHOWTIME_SEAT_MANAGE");

        if (!canManage) {
            if (request.getStatus() == SeatStatus.HELD) {
                requireAuthority(
                        authentication, "SHOWTIME_SEAT_HOLD_OWN");

                // Service hiện tại kiểm tra ghế đã bán hoặc người khác giữ.
            } else if (request.getStatus() == SeatStatus.AVAILABLE) {
                requireAuthority(
                        authentication, "SHOWTIME_SEAT_RELEASE_OWN");

                User user = userRepository
                        .findByEmail(authentication.getName())
                        .orElseThrow(() -> new AccessDeniedException(
                                "Không tìm thấy tài khoản đăng nhập"));

                List<ShowtimeSeat> seats =
                        showtimeSeatRepository.findByShowtimeIdAndIdIn(
                                showtimeId, request.getShowtimeSeatIds());

                if (seats.size() != request.getShowtimeSeatIds().size()) {
                    throw new AccessDeniedException(
                            "Danh sách ghế không hợp lệ");
                }

                for (ShowtimeSeat seat : seats) {
                    if (seat.getStatus() != SeatStatus.HELD
                            || seat.getHeldByUser() == null
                            || !Objects.equals(
                                    seat.getHeldByUser().getId(),
                                    user.getId())) {
                        throw new AccessDeniedException(
                                "Bạn chỉ được giải phóng ghế mình đang giữ");
                    }
                }
            } else {
                throw new AccessDeniedException(
                        "Thay đổi trạng thái này cần quyền quản lý ghế");
            }
        }

        return ResponseEntity.ok(
                showtimeSeatService.updateSeatStatus(
                        showtimeId,
                        request,
                        authentication.getName()));
    }

    private boolean hasAuthority(
            Authentication authentication, String permission) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority ->
                        permission.equals(authority.getAuthority()));
    }

    private void requireAuthority(
            Authentication authentication, String permission) {
        if (!hasAuthority(authentication, permission)) {
            throw new AccessDeniedException(
                    "Bạn không có quyền: " + permission);
        }
    }
}