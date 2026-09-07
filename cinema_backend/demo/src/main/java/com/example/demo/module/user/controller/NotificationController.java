package com.example.demo.module.user.controller;

import com.example.demo.module.user.dto.request.CreateNotificationRequest;
import com.example.demo.module.user.dto.response.NotificationResponse;
import com.example.demo.module.user.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // Lấy danh sách thông báo của User đang đăng nhập (bao gồm cả thông báo hệ thống)
    @GetMapping("/me")
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            Authentication authentication,
            @PageableDefault(size = 10) Pageable pageable) {
        String email = authentication.getName();
        return ResponseEntity.ok(notificationService.getUserNotifications(email, pageable));
    }

    // Đánh dấu 1 thông báo là đã đọc
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            Authentication authentication,
            @PathVariable Long id) {
        String email = authentication.getName();
        notificationService.markAsRead(id, email);
        return ResponseEntity.noContent().build();
    }

    // Đánh dấu tất cả thông báo là đã đọc
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        String email = authentication.getName();
        notificationService.markAllAsRead(email);
        return ResponseEntity.noContent().build();
    }

    // Admin tạo thông báo hệ thống hoặc gửi cho 1 user cụ thể
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NotificationResponse> createNotification(
            @Valid @RequestBody CreateNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationService.createNotification(request));
    }
}
