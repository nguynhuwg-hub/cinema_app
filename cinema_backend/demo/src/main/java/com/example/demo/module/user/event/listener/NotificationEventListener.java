package com.example.demo.module.user.event.listener;

import com.example.demo.module.user.dto.request.CreateNotificationRequest;
import com.example.demo.module.user.dto.response.NotificationResponse;
import com.example.demo.module.user.event.payload.BookingSuccessEvent;
import com.example.demo.module.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @EventListener
    public void handleBookingSuccessEvent(BookingSuccessEvent event) {
        log.info("Xử lý sự kiện đặt vé thành công cho User ID: {}", event.getUserId());

        String title = "Đặt vé thành công!";
        String content = String.format("Bạn đã đặt thành công vé phim %s. Mã đơn: %s. Tổng tiền: %,.0f VNĐ",
                event.getMovieTitle(), event.getBookingCode(), event.getTotalAmount());

        // 1. Lưu thông báo vào DB
        CreateNotificationRequest request = CreateNotificationRequest.builder()
                .userId(event.getUserId())
                .title(title)
                .content(content)
                .build();

        NotificationResponse response = notificationService.createNotification(request);

        // 2. Bắn WebSocket Realtime tới kênh riêng của User
        String destination = "/topic/users/" + event.getUserId() + "/notifications";
        messagingTemplate.convertAndSend(destination, response);
    }
}
