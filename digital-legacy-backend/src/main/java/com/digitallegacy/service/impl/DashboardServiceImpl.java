package com.digitallegacy.service.impl;

import com.digitallegacy.dto.response.ActivityLogDto;
import com.digitallegacy.dto.response.NotificationDto;
import com.digitallegacy.dto.response.UserDashboardDto;
import com.digitallegacy.entity.enums.EmergencyRequestStatus;
import com.digitallegacy.repository.*;
import com.digitallegacy.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DigitalAssetRepository assetRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final AssetPermissionRepository permissionRepository;
    private final EmergencyRequestRepository emergencyRequestRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityLogRepository activityLogRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDashboardDto getUserDashboard(Long userId) {
        long totalAssets = assetRepository.countByUserId(userId);
        long totalBeneficiaries = beneficiaryRepository.countByOwnerId(userId);
        long activePermissions = permissionRepository.countActivePermissionsByOwnerId(userId);
        long pendingRequests = emergencyRequestRepository.countByOwnerIdAndStatus(userId, EmergencyRequestStatus.PENDING);
        long completedRequests = emergencyRequestRepository.countByOwnerIdAndStatus(userId, EmergencyRequestStatus.COMPLETED);
        long unreadNotifications = notificationRepository.countByUserIdAndIsReadFalse(userId);

        // Category distribution
        Map<String, Long> categoryDistribution = new HashMap<>();
        List<Object[]> categoryCounts = assetRepository.countUserAssetsGroupedByCategory(userId);
        for (Object[] row : categoryCounts) {
            String categoryName = (String) row[0];
            Long count = (Long) row[1];
            categoryDistribution.put(categoryName, count);
        }

        // Recent Activities
        List<ActivityLogDto> recentActivities = activityLogRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(log -> ActivityLogDto.builder()
                        .id(log.getId())
                        .action(log.getAction())
                        .description(log.getDescription())
                        .ipAddress(log.getIpAddress())
                        .createdAt(log.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        // Recent Notifications
        List<NotificationDto> recentNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .limit(5)
                .map(n -> NotificationDto.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .type(n.getType())
                        .isRead(n.getIsRead())
                        .readAt(n.getReadAt())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return UserDashboardDto.builder()
                .totalAssets(totalAssets)
                .totalBeneficiaries(totalBeneficiaries)
                .activePermissions(activePermissions)
                .pendingEmergencyRequests(pendingRequests)
                .completedRequests(completedRequests)
                .unreadNotificationsCount(unreadNotifications)
                .categoryDistribution(categoryDistribution)
                .recentActivities(recentActivities)
                .recentNotifications(recentNotifications)
                .build();
    }
}
