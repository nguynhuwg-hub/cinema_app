package com.example.demo.module.user.service;

import com.example.demo.module.user.dto.request.CreateNotificationRequest;
import com.example.demo.module.user.dto.response.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    Page<NotificationResponse> getUserNotifications(String email, Pageable pageable);
    void markAsRead(Long notificationId, String email);
    void markAllAsRead(String email);
    NotificationResponse createNotification(CreateNotificationRequest request);
}