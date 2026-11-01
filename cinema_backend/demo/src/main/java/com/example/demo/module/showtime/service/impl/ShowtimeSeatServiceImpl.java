package com.example.demo.module.showtime.service.impl;

import com.example.demo.entity.enums.SeatStatus;
import com.example.demo.module.showtime.dto.request.UpdateSeatStatusRequest;
import com.example.demo.module.showtime.dto.response.SeatLayoutResponse;
import com.example.demo.module.showtime.dto.response.ShowtimeSeatResponse;
import com.example.demo.module.showtime.entity.ShowtimeSeat;
import com.example.demo.module.showtime.repository.ShowtimeSeatRepository;
import com.example.demo.module.showtime.service.ShowtimeSeatService;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeSeatServiceImpl implements ShowtimeSeatService {

    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public SeatLayoutResponse getSeatLayoutByShowtimeId(Long showtimeId) {
        List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeIdWithDetails(showtimeId);
        LocalDateTime now = LocalDateTime.now();

        // Tự động xả các ghế HELD đã hết hạn 15 phút
        boolean isUpdated = false;
        for (ShowtimeSeat seat : seats) {
            if (SeatStatus.HELD.equals(seat.getStatus()) 
                    && seat.getHoldExpiresAt() != null 
                    && seat.getHoldExpiresAt().isBefore(now)) {
                seat.setStatus(SeatStatus.AVAILABLE);
                seat.setHeldByUser(null);
                seat.setHoldExpiresAt(null);
                isUpdated = true;
            }
        }

        if (isUpdated) {
            seats = showtimeSeatRepository.saveAll(seats);
        }

        List<ShowtimeSeatResponse> seatResponses = seats.stream()
                .map(this::mapToResponse)
                .toList();

        int availableSeats = (int) seats.stream()
                .filter(s -> SeatStatus.AVAILABLE.equals(s.getStatus()))
                .count();

        return SeatLayoutResponse.builder()
                .showtimeId(showtimeId)
                .totalSeats(seats.size())
                .availableSeats(availableSeats)
                .seats(seatResponses)
                .build();
    }

    @Override
    @Transactional
    public List<ShowtimeSeatResponse> updateSeatStatus(Long showtimeId, UpdateSeatStatusRequest request, String emailOrUsername) {
        List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeIdAndIdIn(
                showtimeId, request.getShowtimeSeatIds());

        if (seats.size() != request.getShowtimeSeatIds().size()) {
            throw new IllegalArgumentException("Một số ghế không thuộc về suất chiếu id: " + showtimeId);
        }

        // Lấy User từ Token thay vì request
        User user = userRepository.findByEmail(emailOrUsername)
                .orElseGet(() -> userRepository.findByEmail(emailOrUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + emailOrUsername)));

        LocalDateTime now = LocalDateTime.now();

        if (SeatStatus.HELD.equals(request.getStatus())) {
            for (ShowtimeSeat seat : seats) {
                // Kiểm tra nếu ghế đang được người khác giữ và CHƯA hết hạn
                if (SeatStatus.HELD.equals(seat.getStatus()) 
                        && seat.getHoldExpiresAt() != null 
                        && seat.getHoldExpiresAt().isAfter(now)
                        && seat.getHeldByUser() != null 
                        && !seat.getHeldByUser().getId().equals(user.getId())) {
                    throw new IllegalStateException("Ghế " + seat.getSeat().getSeatRow() + seat.getSeat().getSeatNumber() + " đang được người khác giữ.");
                }

                // Kiểm tra nếu ghế đã bán/khóa
                if (SeatStatus.BOOKED.equals(seat.getStatus()) || SeatStatus.HELD.equals(seat.getStatus())) {
                    throw new IllegalStateException("Ghế " + seat.getSeat().getSeatRow() + seat.getSeat().getSeatNumber() + " không còn khả dụng.");
                }

                // Cập nhật trạng thái giữ ghế trong 15 phút
                seat.setStatus(SeatStatus.HELD);
                seat.setHeldByUser(user);
                seat.setHoldExpiresAt(now.plusMinutes(15));
            }
        } else if (SeatStatus.AVAILABLE.equals(request.getStatus())) {
            for (ShowtimeSeat seat : seats) {
                seat.setStatus(SeatStatus.AVAILABLE);
                seat.setHeldByUser(null);
                seat.setHoldExpiresAt(null);
            }
        } else {
            for (ShowtimeSeat seat : seats) {
                seat.setStatus(request.getStatus());
            }
        }

        List<ShowtimeSeat> updatedSeats = showtimeSeatRepository.saveAll(seats);
        List<ShowtimeSeatResponse> responseList = updatedSeats.stream().map(this::mapToResponse).toList();

        // Gửi event WebSocket tới tất cả client đang theo dõi
        messagingTemplate.convertAndSend("/topic/showtimes/" + showtimeId + "/seats", responseList);

        return responseList;
    }

    private ShowtimeSeatResponse mapToResponse(ShowtimeSeat seat) {
        return ShowtimeSeatResponse.builder()
                .id(seat.getId())
                .showtimeId(seat.getShowtime().getId())
                .seatId(seat.getSeat().getId())
                .seatNumber(seat.getSeat().getSeatRow() + seat.getSeat().getSeatNumber())
                .seatType(seat.getSeat().getSeatType())
                .status(seat.getStatus())
                .heldByUserId(seat.getHeldByUser() != null ? seat.getHeldByUser().getId() : null)
                .heldByUserName(seat.getHeldByUser() != null ? seat.getHeldByUser().getFullName() : null)
                .holdExpiresAt(seat.getHoldExpiresAt())
                .build();
    }
}