package com.example.demo.module.booking.service;

import com.example.demo.common.enums.AccountStatus;
import com.example.demo.common.exception.BadRequestException;
import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.entity.enums.*;
import com.example.demo.module.booking.dto.*;
import com.example.demo.module.booking.entity.*;
import com.example.demo.module.booking.enums.BookingStatus;
import com.example.demo.module.booking.repository.*;
import com.example.demo.module.showtime.entity.*;
import com.example.demo.module.showtime.repository.*;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.UserRepository;
import com.example.demo.module.user.event.payload.BookingSuccessEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(isolation = Isolation.READ_COMMITTED)
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookings;
    private final TicketRepository tickets;
    private final PaymentRepository payments;
    private final ShowtimeRepository showtimes;
    private final ShowtimeSeatRepository showtimeSeats;
    private final UserRepository users;
    private final BookingPricing pricing;
    private final ApplicationEventPublisher events;
    private final RedisSeatHoldService redisHolds;

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse createBooking(
            BookingRequest request,
            String email
    ) {
        User user = activeUser(email);

        if (request.getSeatIds() == null
                || request.getSeatIds().isEmpty()
                || request.getSeatIds().stream().anyMatch(Objects::isNull)
                || new HashSet<>(request.getSeatIds()).size()
                    != request.getSeatIds().size()) {
            throw new BadRequestException(
                    "Hãy chọn các ghế hợp lệ, không trùng nhau."
            );
        }

        if (request.getConcessionIds() != null
                && !request.getConcessionIds().isEmpty()) {
            throw new BadRequestException(
                    "Đặt bắp nước chưa được hỗ trợ trong luồng này."
            );
        }

        Showtime showtime = lockShowtime(request.getShowtimeId());
        LocalDateTime now = LocalDateTime.now();

        if (!showtime.getStartTime().isAfter(now)) {
            throw new BadRequestException("Suất chiếu đã bắt đầu.");
        }

        expireForShowtime(showtime.getId(), now);

        List<ShowtimeSeat> layout =
                showtimeSeats.findByShowtimeIdWithDetails(showtime.getId());

        List<ShowtimeSeat> selected = layout.stream()
                .filter(s -> request.getSeatIds().contains(s.getSeat().getId()))
                .toList();

        if (selected.size() != request.getSeatIds().size()) {
            throw new BadRequestException(
                    "Một số ghế không thuộc phòng của suất chiếu."
            );
        }

        for (ShowtimeSeat seat : selected) {
            // Redis quyết định khóa giữ ghế còn hiệu lực hay không.
            // Trạng thái BOOKED trong MySQL vẫn chặn ghế đã bán.
            if (seat.getStatus() == SeatStatus.BOOKED) {
                throw new BadRequestException(
                        "Ghế " + seatName(seat) + " đã được bán."
                );
            }
        }

        if (tickets.existsByBookingShowtimeIdAndSeatIdInAndBookingStatus(
                showtime.getId(),
                request.getSeatIds(),
                BookingStatus.PAID
        )) {
            throw new BadRequestException("Một số ghế đã được bán.");
        }

        // Giữ tối đa 10 phút, không quá giờ bắt đầu suất chiếu.
        LocalDateTime expiresAt = now.plusMinutes(10);

        if (expiresAt.isAfter(showtime.getStartTime())) {
            expiresAt = showtime.getStartTime();
        }

        BigDecimal total = selected.stream()
                .map(s -> pricing.price(
                        showtime.getBasePrice(),
                        s.getSeat().getSeatType()
                ))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Booking booking = bookings.save(
                Booking.builder()
                        .user(user)
                        .showtime(showtime)
                        .originalPrice(total)
                        .discountAmount(BigDecimal.ZERO)
                        .finalAmount(total)
                        .status(BookingStatus.PENDING)
                        .holdExpiresAt(expiresAt)
                        .build()
        );

        Duration remaining =
                Duration.between(LocalDateTime.now(), expiresAt);

        // Lua kiểm tra và giữ cả nhóm ghế trong một thao tác nguyên tử.
        if (!redisHolds.acquire(
                showtime.getId(),
                request.getSeatIds(),
                booking.getId(),
                remaining
        )) {
            throw new BadRequestException(
                    "Một số ghế đang được người khác giữ. Vui lòng chọn lại."
            );
        }

        List<Ticket> reserved = new ArrayList<>();

        for (ShowtimeSeat seat : selected) {
            // Metadata trong MySQL phục vụ thông tin booking/sơ đồ.
            seat.setStatus(SeatStatus.HELD);
            seat.setHeldByUser(user);
            seat.setHoldExpiresAt(expiresAt);

            // Lưu ghế và giá để tải lại checkout không mất dữ liệu.
            // Mã vé chỉ được trả về khi booking chuyển sang PAID.
            reserved.add(
                    Ticket.builder()
                            .booking(booking)
                            .seat(seat.getSeat())
                            .price(pricing.price(
                                    showtime.getBasePrice(),
                                    seat.getSeat().getSeatType()
                            ))
                            .ticketCode("TK-" + UUID.randomUUID())
                            .isCheckedIn(false)
                            .build()
            );
        }

        showtimeSeats.saveAll(selected);
        tickets.saveAll(reserved);

        return response(booking);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse getBookingById(Long id, String email) {
        Booking booking = ownedLockedBooking(id, email);

        expireForShowtime(
                booking.getShowtime().getId(),
                LocalDateTime.now()
        );

        return response(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String email) {
        activeUser(email);

        return bookings.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::response)
                .toList();
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse cancelBooking(Long id, String email) {
        Booking booking = ownedLockedBooking(id, email);

        expireForShowtime(
                booking.getShowtime().getId(),
                LocalDateTime.now()
        );

        if (booking.getStatus() == BookingStatus.PAID) {
            throw new BadRequestException(
                    "Đơn đã thanh toán không thể hủy bằng thao tác này."
            );
        }

        if (booking.getStatus() == BookingStatus.PENDING) {
            release(booking);
            booking.setStatus(BookingStatus.CANCELLED);

            payments.findByBookingId(id).ifPresent(
                    p -> p.setPaymentStatus(PaymentStatus.FAILED)
            );
        }

        return response(booking);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse preparePayment(Long id, String email) {
        Booking booking = ownedLockedBooking(id, email);

        expireForShowtime(
                booking.getShowtime().getId(),
                LocalDateTime.now()
        );

        if (booking.getStatus() != BookingStatus.PENDING) {
            return response(booking);
        }

        if (payments.findByBookingId(id).isEmpty()) {
            payments.save(
                    Payment.builder()
                            .booking(booking)
                            .amount(booking.getFinalAmount())
                            .paymentMethod(PaymentMethod.VNPAY)
                            .paymentStatus(PaymentStatus.PENDING)
                            .build()
            );
        }

        return response(booking);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public String applyVnpayPayment(
            Long id,
            BigDecimal amount,
            String transactionNo,
            String responseCode,
            boolean success
    ) {
        Long showtimeId = bookings.findShowtimeId(id).orElse(null);

        if (showtimeId == null) {
            return "01";
        }

        lockShowtime(showtimeId);

        Booking booking = bookings.findById(id).orElseThrow();

        if (amount.compareTo(booking.getFinalAmount()) != 0) {
            return "04";
        }

        Optional<Payment> found = payments.findByBookingId(id);

        if (found.isEmpty()) {
            return "01";
        }

        Payment payment = found.get();

        if (payment.getPaymentStatus() == PaymentStatus.SUCCESS) {
            return "02";
        }

        if (booking.getStatus() == BookingStatus.PAID) {
            return success
                    && Objects.equals(
                            payment.getTransactionCode(),
                            transactionNo
                    )
                    ? "02"
                    : "99";
        }

        expireForShowtime(showtimeId, LocalDateTime.now());

        if (booking.getStatus() != BookingStatus.PENDING) {
            // Nhận tiền sau khi đơn hết hạn/hủy: ghi nhận để đối soát.
            // Không lấy lại ghế đang thuộc booking khác.
            if (success) {
                payment.setPaymentStatus(PaymentStatus.SUCCESS);
                payment.setPaidAt(LocalDateTime.now());
                payment.setResponseCode(responseCode);
                payment.setTransactionCode(transactionNo);

                return "00";
            }

            return "02";
        }

        List<Ticket> reserved =
                tickets.findByBookingIdOrderById(id);

        List<ShowtimeSeat> layout =
                showtimeSeats.findByShowtimeIdWithDetails(showtimeId);

        List<Long> reservedSeatIds = reserved.stream()
                .map(t -> t.getSeat().getId())
                .toList();

        // Chỉ xác nhận khi mọi khóa Redis vẫn thuộc đúng booking.
        if (!redisHolds.ownsAll(showtimeId, reservedSeatIds, id)) {
            return "99";
        }

        for (Ticket ticket : reserved) {
            ShowtimeSeat seat = layout.stream()
                    .filter(s -> s.getSeat().getId()
                            .equals(ticket.getSeat().getId()))
                    .findFirst()
                    .orElseThrow();

            if (seat.getStatus() != SeatStatus.HELD
                    || seat.getHeldByUser() == null
                    || !seat.getHeldByUser().getId()
                        .equals(booking.getUser().getId())
                    || seat.getHoldExpiresAt() == null
                    || !seat.getHoldExpiresAt()
                        .isAfter(LocalDateTime.now())) {
                return "99";
            }
        }

        if (reserved.isEmpty()) {
            return "99";
        }

        payment.setResponseCode(responseCode);
        payment.setTransactionCode(transactionNo);

        if (!success) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            release(booking);
            booking.setStatus(BookingStatus.CANCELLED);

            return "00";
        }

        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        booking.setStatus(BookingStatus.PAID);

        for (Ticket ticket : reserved) {
            ShowtimeSeat seat = layout.stream()
                    .filter(s -> s.getSeat().getId()
                            .equals(ticket.getSeat().getId()))
                    .findFirst()
                    .orElseThrow();

            seat.setStatus(SeatStatus.BOOKED);
            seat.setHeldByUser(null);
            seat.setHoldExpiresAt(null);
        }

        showtimeSeats.saveAll(layout);

        // Chỉ xóa khóa Redis sau khi SQL commit thành công.
        redisHolds.releaseAfterCommit(
                showtimeId,
                reservedSeatIds,
                id
        );

        events.publishEvent(
                BookingSuccessEvent.builder()
                        .userId(booking.getUser().getId())
                        .bookingCode("BK-" + id)
                        .movieTitle(
                                booking.getShowtime().getMovie().getTitle()
                        )
                        .totalAmount(
                                booking.getFinalAmount().doubleValue()
                        )
                        .build()
        );

        return "00";
    }

    @Override
    @Scheduled(
            fixedDelayString = "${app.booking.expiry-check-ms:30000}",
            initialDelayString = "${app.booking.expiry-check-ms:30000}"
    )
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void expirePendingBookings() {
        LocalDateTime now = LocalDateTime.now();

        for (Long id : bookings.findExpiredShowtimeIds(
                BookingStatus.PENDING,
                now
        )) {
            lockShowtime(id);
            expireForShowtime(id, now);
        }
    }

    private void expireForShowtime(
            Long showtimeId,
            LocalDateTime now
    ) {
        for (Booking booking : bookings.findByShowtimeIdAndStatus(
                showtimeId,
                BookingStatus.PENDING
        )) {
            LocalDateTime expiry = booking.getHoldExpiresAt() != null
                    ? booking.getHoldExpiresAt()
                    : booking.getCreatedAt().plusMinutes(10);

            List<Long> ids = tickets
                    .findByBookingIdOrderById(booking.getId())
                    .stream()
                    .map(t -> t.getSeat().getId())
                    .toList();

            // Hết thời hạn hoặc mất quyền sở hữu khóa Redis.
            if (!expiry.isAfter(now)
                    || !redisHolds.ownsAll(
                            showtimeId,
                            ids,
                            booking.getId()
                    )) {
                release(booking);
                booking.setStatus(BookingStatus.EXPIRED);

                payments.findByBookingId(booking.getId()).ifPresent(
                        p -> p.setPaymentStatus(PaymentStatus.FAILED)
                );
            }
        }
    }

    private void release(Booking booking) {
        Set<Long> seatIds = new HashSet<>(
                tickets.findByBookingIdOrderById(booking.getId())
                        .stream()
                        .map(t -> t.getSeat().getId())
                        .toList()
        );

        // Lua chỉ xóa khóa thuộc booking này, sau SQL commit.
        redisHolds.releaseAfterCommit(
                booking.getShowtime().getId(),
                new ArrayList<>(seatIds),
                booking.getId()
        );

        for (ShowtimeSeat seat :
                showtimeSeats.findByShowtimeIdWithDetails(
                        booking.getShowtime().getId()
                )) {
            if (seatIds.contains(seat.getSeat().getId())
                    && seat.getStatus() == SeatStatus.HELD
                    && seat.getHeldByUser() != null
                    && seat.getHeldByUser().getId()
                        .equals(booking.getUser().getId())
                    && Objects.equals(
                            seat.getHoldExpiresAt(),
                            booking.getHoldExpiresAt()
                    )) {
                seat.setStatus(SeatStatus.AVAILABLE);
                seat.setHeldByUser(null);
                seat.setHoldExpiresAt(null);
            }
        }
    }

    private Booking ownedLockedBooking(Long id, String email) {
        activeUser(email);

        Long showtimeId = bookings.findShowtimeId(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn đặt vé."
                ));

        lockShowtime(showtimeId);

        Booking booking = bookings.findById(id).orElseThrow();

        if (!booking.getUser().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Đơn đặt vé không thuộc tài khoản của bạn."
            );
        }

        return booking;
    }

    private Showtime lockShowtime(Long id) {
        return showtimes.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy suất chiếu."
                ));
    }

    private User activeUser(String email) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng."
                ));

        if (user.getStatus() != AccountStatus.ACTIVE
                || !user.isEmailVerified()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Tài khoản chưa được kích hoạt hoặc đang bị khóa."
            );
        }

        return user;
    }

    private String seatName(ShowtimeSeat seat) {
        return seat.getSeat().getSeatRow()
                + seat.getSeat().getSeatNumber();
    }

    private BookingResponse response(Booking booking) {
        List<Ticket> reserved =
                tickets.findByBookingIdOrderById(booking.getId());

        BookingResponse result = new BookingResponse();

        result.setId(booking.getId());
        result.setUserId(booking.getUser().getId());
        result.setShowtimeId(booking.getShowtime().getId());
        result.setMovieTitle(
                booking.getShowtime().getMovie().getTitle()
        );
        result.setHallName(
                booking.getShowtime().getHall().getName()
        );

        result.setStartTime(
                booking.getShowtime().getStartTime()
                        .atZone(java.time.ZoneId.systemDefault())
                        .toOffsetDateTime()
        );

        result.setStatus(booking.getStatus().name());
        result.setTotalAmount(booking.getFinalAmount());
        result.setCreatedAt(booking.getCreatedAt());

        result.setHoldExpiresAt(
                booking.getHoldExpiresAt() == null
                        ? null
                        : booking.getHoldExpiresAt()
                                .atZone(java.time.ZoneId.systemDefault())
                                .toOffsetDateTime()
        );

        result.setSeatIds(
                reserved.stream()
                        .map(t -> t.getSeat().getId())
                        .toList()
        );

        result.setConcessionIds(List.of());

        result.setSeats(
                reserved.stream()
                        .map(t -> BookingSeatResponse.builder()
                                .seatId(t.getSeat().getId())
                                .seatNumber(
                                        t.getSeat().getSeatRow()
                                                + t.getSeat().getSeatNumber()
                                )
                                .price(t.getPrice())
                                .ticketCode(
                                        booking.getStatus() == BookingStatus.PAID
                                                ? t.getTicketCode()
                                                : null
                                )
                                .build())
                        .toList()
        );

        payments.findByBookingId(booking.getId()).ifPresent(payment -> {
            result.setPaymentStatus(
                    payment.getPaymentStatus().name()
            );

            result.setPaymentReviewRequired(
                    payment.getPaymentStatus() == PaymentStatus.SUCCESS
                            && booking.getStatus() != BookingStatus.PAID
            );
        });

        return result;
    }
    @Override
@Transactional(isolation = Isolation.READ_COMMITTED)
public void saveVnpayTransaction(
        Long bookingId,
        String txnRef,
        String createDate
) {
    Long showtimeId = bookings.findShowtimeId(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException(
                    "Không tìm thấy đơn đặt vé."
            ));

    lockShowtime(showtimeId);

    Booking booking = bookings.findById(bookingId)
            .orElseThrow();

    expireForShowtime(showtimeId, LocalDateTime.now());

    if (booking.getStatus() != BookingStatus.PENDING) {
        throw new BadRequestException(
                "Đơn đặt vé không còn hiệu lực."
        );
    }

    Payment payment = payments.findByBookingId(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException(
                    "Không tìm thấy thông tin thanh toán."
            ));

    if (payment.getVnpTxnRef() != null) {
        if (!Objects.equals(payment.getVnpTxnRef(), txnRef)
        || !Objects.equals(payment.getVnpCreateDate(), createDate)) {
            throw new BadRequestException(
                    "Đơn đã có giao dịch VNPay khác."
            );
        }

        return;
    }

    payment.setVnpTxnRef(txnRef);
    payment.setVnpCreateDate(createDate);
}
}