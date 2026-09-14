package com.example.demo.module.booking.service;

import com.example.demo.module.booking.dto.BookingRequest;
import com.example.demo.module.booking.dto.BookingResponse;
import com.example.demo.module.booking.entity.Booking;
import com.example.demo.module.booking.entity.Ticket;
import com.example.demo.module.booking.enums.BookingStatus;
import com.example.demo.module.booking.repository.BookingRepository;
import com.example.demo.module.showtime.entity.Showtime;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.booking.repository.TicketRepository;
import com.example.demo.module.cinema.entity.Seat;
import com.example.demo.module.booking.entity.Ticket;
import com.example.demo.module.cinema.entity.Seat;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final StringRedisTemplate redisTemplate;
    private final ShowtimeInternalService showtimeInternalService;
    private final TicketRepository ticketRepository;

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        // 1. Kiểm tra ghế trống
        boolean isAvailable = showtimeInternalService.areSeatsAvailable(request.getShowtimeId(), request.getSeatIds());
        if (!isAvailable) {
            throw new RuntimeException("Một hoặc nhiều ghế bạn chọn đã bị người khác đặt!");
        }

        // 2. Tính toán tiền tệ theo 3 trường giá của Entity chung
        BigDecimal seatPrice = new BigDecimal("100000.00");
        BigDecimal calculatedOriginalPrice = seatPrice.multiply(new BigDecimal(request.getSeatIds().size()));
        BigDecimal calculatedDiscount = BigDecimal.ZERO; // Chưa có coupon
        BigDecimal calculatedFinal = calculatedOriginalPrice.subtract(calculatedDiscount);

        // 3. Khởi tạo Proxy Entity cho User & Showtime để thiết lập Foreign Keys
        User userProxy = new User();
        userProxy.setId(request.getUserId());

        Showtime showtimeProxy = new Showtime();
        showtimeProxy.setId(request.getShowtimeId());

        // 4. Build đối tượng Booking
        Booking booking = Booking.builder()
                .user(userProxy)
                .showtime(showtimeProxy)
                .originalPrice(calculatedOriginalPrice)
                .discountAmount(calculatedDiscount)
                .finalAmount(calculatedFinal)
                .status(BookingStatus.PENDING) // Enum thay vì String
                .build();

        // 5. Lưu vào Database
        Booking savedBooking = bookingRepository.save(booking);
        // 5.1. Tạo danh sách Ticket từ danh sách seatIds trong Request
        List<Ticket> tickets = request.getSeatIds().stream()
                .map(seatId -> {
                    Seat seatProxy = new Seat();
                    seatProxy.setId(seatId);
                    return Ticket.builder()
                            .booking(savedBooking)
                            .seat(seatProxy)
                            .ticketCode("TICKET-" + savedBooking.getId() + "-" + seatId) // Mã vé duy nhất
                            .price(seatPrice) // Giá vé
                            .isCheckedIn(false)
                            .build();
                })
                .collect(Collectors.toList());
        // 5.2. Lưu danh sách Ticket xuống DB và ép Hibernate flush ngay lập tức
        ticketRepository.saveAll(tickets);
        ticketRepository.flush();

        // 6. Giữ ghế và lập lịch hủy 10 phút trên Redis
        showtimeInternalService.holdSeats(request.getShowtimeId(), request.getSeatIds(), savedBooking.getId());

        String redisKey = "booking:cancel:" + savedBooking.getId();
        redisTemplate.opsForValue().set(redisKey, BookingStatus.PENDING.name(), Duration.ofMinutes(10));

        // 7. Trả về response
        return mapToResponse(savedBooking, request);
    }

    @Override
    public BookingResponse getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + id));
        return mapToResponse(booking, null);
    }

    private BookingResponse mapToResponse(Booking entity, BookingRequest request) {
        BookingResponse response = new BookingResponse();
        response.setId(entity.getId());

        // Trích xuất ID từ đối tượng quan hệ JPA
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