package com.digitallegacy.service;

import com.digitallegacy.dto.response.NotificationDto;
import com.digitallegacy.entity.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    void sendNotification(Long userId, String title, String message, NotificationType type);

    Page<NotificationDto> getUserNotifications(Long userId, Pageable pageable);

    NotificationDto markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);

    void deleteNotification(Long notificationId, Long userId);

    long countUnread(Long userId);
}
