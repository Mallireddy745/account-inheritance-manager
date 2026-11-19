package com.digitallegacy.service.impl;

import com.digitallegacy.entity.ActivityLog;
import com.digitallegacy.entity.AdminAuditLog;
import com.digitallegacy.entity.User;
import com.digitallegacy.repository.ActivityLogRepository;
import com.digitallegacy.repository.AdminAuditLogRepository;
import com.digitallegacy.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final ActivityLogRepository activityLogRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;

    @Override
    @Transactional
    public void logUserActivity(User user, String action, String description, String ipAddress, String userAgent) {
        try {
            ActivityLog logRecord = ActivityLog.builder()
                    .user(user)
                    .action(action)
                    .description(description)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();
            activityLogRepository.save(logRecord);
        } catch (Exception ex) {
            log.error("Failed to record activity log for user {}: {}", user.getEmail(), ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void logAdminAction(User admin, String action, String targetEntity, Long targetId, String details, String ipAddress) {
        try {
            AdminAuditLog auditRecord = AdminAuditLog.builder()
                    .admin(admin)
                    .action(action)
                    .targetEntity(targetEntity)
                    .targetId(targetId)
                    .details(details)
                    .ipAddress(ipAddress)
                    .build();
            adminAuditLogRepository.save(auditRecord);
        } catch (Exception ex) {
            log.error("Failed to record admin audit log for admin {}: {}", admin.getEmail(), ex.getMessage());
        }
    }
}
