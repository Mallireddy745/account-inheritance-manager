package com.digitallegacy.service;

import com.digitallegacy.entity.User;

public interface AuditService {

    void logUserActivity(User user, String action, String description, String ipAddress, String userAgent);

    void logAdminAction(User admin, String action, String targetEntity, Long targetId, String details, String ipAddress);
}
