package com.digitallegacy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDashboardDto {

    private long totalAssets;
    private long totalBeneficiaries;
    private long activePermissions;
    private long pendingEmergencyRequests;
    private long completedRequests;
    private long unreadNotificationsCount;

    @Builder.Default
    private Map<String, Long> categoryDistribution = new HashMap<>();

    @Builder.Default
    private List<ActivityLogDto> recentActivities = new ArrayList<>();

    @Builder.Default
    private List<NotificationDto> recentNotifications = new ArrayList<>();
}
