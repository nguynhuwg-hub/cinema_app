package com.example.demo.module.user.service.impl;

import com.example.demo.common.exception.BadRequestException;
import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.module.user.dto.request.CreateNotificationRequest;
import com.example.demo.module.user.dto.response.NotificationResponse;
import com.example.demo.module.user.entity.Notification;
import com.example.demo.module.user.entity.User;
import com.example.demo.module.user.repository.NotificationRepository;
import com.example.demo.module.user.repository.UserRepository;
import com.example.demo.module.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(String email, Pageable pageable) {
        User user = getUserByEmailOrThrow(email);
        return notificationRepository.findByUserIdOrSystemNotification(user.getId(), pageable)
                .map(this::mapToNotificationResponse);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, String email) {
        User user = getUserByEmailOrThrow(email);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + notificationId));

        if (notification.getUser() != null && !notification.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Bạn không có quyền truy cập thông báo này");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(String email) {
        User user = getUserByEmailOrThrow(email);
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Override
    @Transactional
    public NotificationResponse createNotification(CreateNotificationRequest request) {
        User targetUser = null;
        if (request.getUserId() != null) {
            targetUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getUserId()));
        }

        Notification notification = Notification.builder()
                .user(targetUser)
                .title(request.getTitle())
                .content(request.getContent())
                .isRead(false)
                .build();

        Notification savedNotification = notificationRepository.save(notification);
        return mapToNotificationResponse(savedNotification);
    }

    private User getUserByEmailOrThrow(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    private NotificationResponse mapToNotificationResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUser() != null ? notification.getUser().getId() : null)
                .title(notification.getTitle())
                .content(notification.getContent())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}