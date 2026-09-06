package com.example.demo.module.showtime.dto.request;

import com.example.demo.entity.enums.SeatStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSeatStatusRequest {

    @NotEmpty(message = "Showtime seat IDs list cannot be empty")
    private List<Long> showtimeSeatIds;

    @NotNull(message = "Status is required")
    private SeatStatus status;

    private Long userId; // ID người dùng thực hiện giữ ghế (bắt buộc nếu status = RESERVED/HELD)
}