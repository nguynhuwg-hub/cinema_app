package com.example.demo.module.booking.service;

import com.example.demo.module.booking.dto.BookingRequest;
import com.example.demo.module.booking.dto.BookingResponse;
import com.example.demo.module.booking.entity.Booking;
import com.example.demo.module.booking.entity.Ticket;
import com.example.demo.module.booking.enums.BookingStatus;
import com.example.demo.module.booking.repository.BookingRepository;
import com.example.demo.module.booking.repository.TicketRepository;
import com.example.demo.module.cinema.entity.Seat;
import com.example.demo.module.showtime.entity.Showtime;
import com.example.demo.module.user.entity.User;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final ShowtimeInternalService showtimeInternalService;
    private final EntityManager entityManager;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingResponse createBooking(BookingRequest request) {
        // 1. Kiểm tra ghế rảnh (Redis check key tạm + MySQL check các vé đã PAID)
        boolean isAvailable = showtimeInternalService.areSeatsAvailable(request.getShowtimeId(), request.getSeatIds());
        if (!isAvailable) {
            throw new RuntimeException("Một hoặc nhiều ghế bạn chọn đã bị người khác đặt hoặc đang được giữ!");
        }

        // 2. Tính toán tiền tệ
        BigDecimal seatPrice = new BigDecimal("100000.00");
        BigDecimal calculatedOriginalPrice = seatPrice.multiply(new BigDecimal(request.getSeatIds().size()));
        BigDecimal calculatedDiscount = BigDecimal.ZERO;
        BigDecimal calculatedFinal = calculatedOriginalPrice.subtract(calculatedDiscount);

        // 3. Sử dụng EntityManager.getReference để lấy Proxy Entity
        User userProxy = entityManager.getReference(User.class, request.getUserId());
        Showtime showtimeProxy = entityManager.getReference(Showtime.class, request.getShowtimeId());

        // 4. Khởi tạo và Lưu Booking (Trạng thái PENDING)
        Booking booking = Booking.builder()
                .user(userProxy)
                .showtime(showtimeProxy)
                .originalPrice(calculatedOriginalPrice)
                .discountAmount(calculatedDiscount)
                .finalAmount(calculatedFinal)
                .status(BookingStatus.PENDING)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // 5. GIỮ GHẾ TRÊN REDIS (Thời hạn 10 phút, KHÔNG lưu Ticket xuống MySQL lúc này)
        showtimeInternalService.holdSeats(request.getShowtimeId(), request.getSeatIds(), savedBooking.getId());

        // 6. Trả về response kết quả
        return mapToResponse(savedBooking, request);
    }

    /**
     * Phương thức gọi khi thanh toán thành công (MOMO / VNPAY / Cash)
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public BookingResponse confirmPayment(Long bookingId, List<Long> seatIds) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Đơn hàng không ở trạng thái chờ thanh toán hoặc đã bị hết hạn!");
        }

        // 1. Cập nhật trạng thái Booking thành PAID
        booking.setStatus(BookingStatus.PAID);
        Booking savedBooking = bookingRepository.save(booking);

        // 2. CHÍNH THỨC lưu danh sách vé vào bảng `tickets` trong MySQL
        BigDecimal seatPrice = new BigDecimal("100000.00");
        List<Ticket> tickets = seatIds.stream()
                .map(seatId -> {
                    Seat seatProxy = entityManager.getReference(Seat.class, seatId);
                    return Ticket.builder()
                            .booking(savedBooking)
                            .seat(seatProxy)
                            .ticketCode("TK-" + savedBooking.getId() + "-" + seatId + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase())
                            .price(seatPrice)
                            .isCheckedIn(false)
                            .build();
                })
                .collect(Collectors.toList());

        ticketRepository.saveAll(tickets);

        // 3. Giải phóng Key trên Redis (Vì ghế đã mua chính thức)
        showtimeInternalService.releaseSeats(bookingId);

        return mapToResponse(savedBooking, null);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + id));
        return mapToResponse(booking, null);
    }

    private BookingResponse mapToResponse(Booking entity, BookingRequest request) {
        BookingResponse response = new BookingResponse();
        response.setId(entity.getId());

        if (entity.getUser() != null) {
            response.setUserId(entity.getUser().getId());
        }
        if (entity.getShowtime() != null) {
            response.setShowtimeId(entity.getShowtime().getId());
        }

        response.setTotalAmount(entity.getFinalAmount());
        response.setStatus(entity.getStatus() != null ? entity.getStatus().name() : null);
        response.setCreatedAt(entity.getCreatedAt());

        if (request != null) {
            response.setSeatIds(request.getSeatIds());
            response.setConcessionIds(request.getConcessionIds());
        }
        return response;
    }
}