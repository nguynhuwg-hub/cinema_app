package com.example.demo.module.showtime.service.impl;

import com.example.demo.common.exception.BadRequestException;
import com.example.demo.entity.enums.SeatStatus;
import com.example.demo.module.booking.enums.BookingStatus;
import com.example.demo.module.booking.repository.TicketRepository;
import com.example.demo.module.booking.service.BookingPricing;
import com.example.demo.module.booking.service.RedisSeatHoldService;
import com.example.demo.module.showtime.dto.request.UpdateSeatStatusRequest;
import com.example.demo.module.showtime.dto.response.SeatLayoutResponse;
import com.example.demo.module.showtime.dto.response.ShowtimeSeatResponse;
import com.example.demo.module.showtime.entity.ShowtimeSeat;
import com.example.demo.module.showtime.repository.ShowtimeSeatRepository;
import com.example.demo.module.showtime.service.ShowtimeSeatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ShowtimeSeatServiceImpl implements ShowtimeSeatService {

    private final ShowtimeSeatRepository seats;
    private final TicketRepository tickets;
    private final BookingPricing pricing;
    private final RedisSeatHoldService redisHolds;

    @Override
    @Transactional(readOnly = true)
    public SeatLayoutResponse getSeatLayoutByShowtimeId(
            Long showtimeId
    ) {
        List<ShowtimeSeat> layout =
                seats.findByShowtimeIdWithDetails(showtimeId);

        List<Long> seatIds = layout.stream()
                .map(s -> s.getSeat().getId())
                .toList();

        // Đọc khóa Redis của toàn bộ ghế trong một lần gọi.
        List<String> owners =
                redisHolds.owners(showtimeId, seatIds);

        Map<Long, String> ownersBySeat = new HashMap<>();

        for (int i = 0; i < layout.size(); i++) {
            ownersBySeat.put(
                    layout.get(i).getSeat().getId(),
                    owners.get(i)
            );
        }

        // Vé đã thanh toán được lưu trong MySQL.
        Set<Long> sold = new HashSet<>(
                tickets.findByBookingShowtimeIdAndBookingStatus(
                                showtimeId,
                                BookingStatus.PAID
                        )
                        .stream()
                        .map(t -> t.getSeat().getId())
                        .toList()
        );

        List<ShowtimeSeatResponse> result = layout.stream()
                .map(seat -> {
                    SeatStatus status = seat.getStatus();

                    if (sold.contains(seat.getSeat().getId())) {
                        status = SeatStatus.BOOKED;
                    } else if (status != SeatStatus.BOOKED) {
                        // Có khóa Redis: đang giữ.
                        // Khóa hết TTL hoặc không tồn tại: khả dụng.
                        status = ownersBySeat.get(
                                seat.getSeat().getId()
                        ) != null
                                ? SeatStatus.HELD
                                : SeatStatus.AVAILABLE;
                    }

                    boolean held = status == SeatStatus.HELD;

                    return ShowtimeSeatResponse.builder()
                            .id(seat.getId())
                            .showtimeId(showtimeId)
                            .seatId(seat.getSeat().getId())
                            .seatNumber(
                                    seat.getSeat().getSeatRow()
                                            + seat.getSeat().getSeatNumber()
                            )
                            .seatType(seat.getSeat().getSeatType())
                            .status(status)
                            .price(
                                    pricing.price(
                                            seat.getShowtime().getBasePrice(),
                                            seat.getSeat().getSeatType()
                                    )
                            )
                            .holdExpiresAt(
                                    held
                                            ? seat.getHoldExpiresAt()
                                            : null
                            )
                            .heldByUserId(
                                    held && seat.getHeldByUser() != null
                                            ? seat.getHeldByUser().getId()
                                            : null
                            )
                            .heldByUserName(
                                    held && seat.getHeldByUser() != null
                                            ? seat.getHeldByUser().getFullName()
                                            : null
                            )
                            .build();
                })
                .toList();

        int availableSeats = (int) result.stream()
                .filter(s -> s.getStatus() == SeatStatus.AVAILABLE)
                .count();

        return SeatLayoutResponse.builder()
                .showtimeId(showtimeId)
                .totalSeats(result.size())
                .availableSeats(availableSeats)
                .seats(result)
                .build();
    }

    @Override
    public List<ShowtimeSeatResponse> updateSeatStatus(
            Long id,
            UpdateSeatStatusRequest request,
            String email
    ) {
        throw new BadRequestException(
                "Hãy tạo hoặc hủy booking để giữ/nhả ghế. "
                        + "Không cập nhật trạng thái ghế trực tiếp."
        );
    }
}