package com.digitallegacy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {

    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long suspendedUsers;
    private long totalAssets;
    private long totalBeneficiaries;
    private long pendingRequests;
    private long approvedRequests;
    private long rejectedRequests;
    private long pendingVerifications;
    private long totalNotifications;
    private Map<String, Long> categoryDistribution;
    private List<AdminAuditLogDto> recentAuditLogs;
    private Map<String, Long> monthlyRegistrations;
}
