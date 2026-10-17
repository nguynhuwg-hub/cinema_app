package com.example.demo.module.cinema.service;

import com.example.demo.common.enums.SeatType;
import com.example.demo.module.cinema.dto.seat.SeatResponse;
import com.example.demo.module.cinema.dto.seat.UpdateSeatTypeRequest;
import com.example.demo.module.cinema.entity.Seat;
import com.example.demo.module.cinema.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;

    // Lấy danh sách ghế theo phòng (Nếu chưa truyền basePrice thì mặc định truyền null hoặc giá gốc)
    public List<SeatResponse> getSeatsByHall(Long hallId) {
        return seatRepository.findByHallId(hallId).stream()
                .map(seat -> mapToSeatResponse(seat,null))
                .toList();
    }

    // 2. Hàm dành cho Trang Đặt Vé (Khách hàng): Có truyền basePrice của Suất chiếu
    public List<SeatResponse> getSeatsByHall(Long hallId, Double basePrice) {
    return seatRepository.findByHallId(hallId).stream()
            .map(seat -> mapToSeatResponse(seat, basePrice))
            .toList();
    }
    // Quản lý cập nhật loại ghế
    public SeatResponse updateSeatType(Long id, UpdateSeatTypeRequest request) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Seat not found with id: " + id));

        seat.setSeatType(request.getSeatType());
        return mapToSeatResponse(seatRepository.save(seat), null);
    }

    // Hàm helper tính giá dựa trên enum SeatType
    public Double calculatePrice(Double basePrice, SeatType seatType) {
        if (basePrice == null) return 0.0;
        if (seatType == null) return basePrice;

        return switch (seatType) {
            case VIP -> basePrice * 1.25;      // VIP nhân 1.25
            case COUPLE -> basePrice * 2.0;  // Ghế đôi SWEETBOX nhân 2 (Thay COUPLE bằng SWEETBOX)
            default -> basePrice;              // REGULAR giữ nguyên giá gốc
        };
    }

    // Hàm Convert duy nhất chuẩn hóa dữ liệu trả về cho API
    public SeatResponse mapToSeatResponse(Seat seat, Double basePrice) {
        // Ghép chuỗi an toàn cho fullSeatName
        String fullSeatName = (seat.getSeatRow() != null ? seat.getSeatRow() : "") 
                            + (seat.getSeatNumber() != null ? seat.getSeatNumber() : "");

        // Nếu basePrice == null (trường hợp Admin gọi) thì price sẽ nhận giá trị null/0.0
        Double price = (basePrice != null) ? calculatePrice(basePrice, seat.getSeatType()) : null;

        return SeatResponse.builder()
            .id(seat.getId())
            .seatRow(seat.getSeatRow())
            .seatNumber(seat.getSeatNumber())
            .fullSeatName(fullSeatName)
            .seatType(seat.getSeatType())
            .hallId(seat.getHall() != null ? seat.getHall().getId() : null)
            .price(price)
            .build();
    }
}
