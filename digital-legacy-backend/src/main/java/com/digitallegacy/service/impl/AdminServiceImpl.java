package com.digitallegacy.service.impl;

import com.digitallegacy.dto.response.*;
import com.digitallegacy.entity.*;
import com.digitallegacy.entity.enums.*;
import com.digitallegacy.exception.ResourceNotFoundException;
import com.digitallegacy.repository.*;
import com.digitallegacy.service.AdminService;
import com.digitallegacy.service.AuditService;
import com.digitallegacy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final DigitalAssetRepository digitalAssetRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final EmergencyRequestRepository emergencyRequestRepository;
    private final VerificationRecordRepository verificationRecordRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final NotificationRepository notificationRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final com.digitallegacy.service.AssetService assetService;
    private final com.digitallegacy.service.FileStorageService fileStorageService;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardDto getDashboard() {
        long totalUsers = userRepository.count() - userRepository.countByRole(Role.ADMIN);
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long inactiveUsers = userRepository.countByStatus(UserStatus.INACTIVE);
        long suspendedUsers = userRepository.countByStatus(UserStatus.SUSPENDED);
        long totalAssets = digitalAssetRepository.count();
        long totalBeneficiaries = beneficiaryRepository.count();
        long pendingRequests = emergencyRequestRepository.countByStatus(EmergencyRequestStatus.PENDING)
                + emergencyRequestRepository.countByStatus(EmergencyRequestStatus.UNDER_REVIEW);
        long approvedRequests = emergencyRequestRepository.countByStatus(EmergencyRequestStatus.APPROVED);
        long rejectedRequests = emergencyRequestRepository.countByStatus(EmergencyRequestStatus.REJECTED);
        long pendingVerifications = verificationRecordRepository.countByStatus(VerificationRecordStatus.PENDING);
        long totalNotifications = notificationRepository.count();

        // Category distribution
        Map<String, Long> categoryDistribution = new LinkedHashMap<>();
        List<Object[]> catCounts = digitalAssetRepository.countAssetsGroupedByCategory();
        for (Object[] row : catCounts) {
            categoryDistribution.put((String) row[0], (Long) row[1]);
        }

        // Recent audit logs
        List<AdminAuditLogDto> recentAuditLogs = adminAuditLogRepository.findTop15ByOrderByCreatedAtDesc()
                .stream().map(this::toAuditLogDto).collect(Collectors.toList());

        // Monthly registrations (last 6 months) - simplified
        Map<String, Long> monthlyRegistrations = new LinkedHashMap<>();

        return AdminDashboardDto.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .suspendedUsers(suspendedUsers)
                .totalAssets(totalAssets)
                .totalBeneficiaries(totalBeneficiaries)
                .pendingRequests(pendingRequests)
                .approvedRequests(approvedRequests)
                .rejectedRequests(rejectedRequests)
                .pendingVerifications(pendingVerifications)
                .totalNotifications(totalNotifications)
                .categoryDistribution(categoryDistribution)
                .recentAuditLogs(recentAuditLogs)
                .monthlyRegistrations(monthlyRegistrations)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserDto> getAllUsers(String search, UserStatus status, Pageable pageable) {
        Page<User> usersPage;

        if (search != null && !search.isBlank()) {
            usersPage = userRepository.findByEmailContainingIgnoreCase(search, pageable);
        } else if (status != null) {
            usersPage = userRepository.findByStatus(status, pageable);
        } else {
            usersPage = userRepository.findAll(pageable);
        }

        List<AdminUserDto> dtos = usersPage.getContent().stream()
                .filter(u -> u.getRole() != Role.ADMIN)
                .map(this::toAdminUserDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, usersPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserDto getUserDetails(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (user.getRole() == Role.ADMIN) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        return toAdminUserDto(user);
    }

    @Override
    @Transactional
    public AdminUserDto changeUserStatus(Long userId, UserStatus newStatus, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw new IllegalStateException("Cannot change status of an administrator account");
        }

        UserStatus oldStatus = user.getStatus();
        user.setStatus(newStatus);
        userRepository.save(user);

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        // Audit log
        auditService.logAdminAction(admin, "CHANGE_USER_STATUS", "User", userId,
                "Changed user status from " + oldStatus + " to " + newStatus, null);

        // Notify the user
        notificationService.sendNotification(userId,
                "Account Status Changed",
                "Your account status has been changed to " + newStatus.name() + ". Please contact support if you have questions.",
                NotificationType.SECURITY);

        log.info("Admin {} changed user {} status from {} to {}", adminId, userId, oldStatus, newStatus);

        return toAdminUserDto(user);
    }

    @Override
    @Transactional
    public AdminUserDto createVerifier(com.digitallegacy.dto.request.CreateVerifierRequestDto request, Long adminId) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (!cleanEmail.endsWith("@digitallegacy.com")) {
            throw new IllegalArgumentException("Verifier accounts must use an official '@digitallegacy.com' email address.");
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new com.digitallegacy.exception.DuplicateResourceException("An account with email " + cleanEmail + " already exists.");
        }

        User verifier = User.builder()
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.VERIFIER)
                .status(UserStatus.ACTIVE)
                .failedLoginAttempts(0)
                .build();

        UserProfile profile = UserProfile.builder()
                .user(verifier)
                .fullName(request.getFullName().trim())
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .emailVerified(true)
                .phoneVerified(true)
                .build();

        verifier.setProfile(profile);
        User savedVerifier = userRepository.save(verifier);

        User admin = userRepository.findById(adminId).orElse(null);
        if (admin != null) {
            auditService.logAdminAction(admin, "CREATE_VERIFIER", "User", savedVerifier.getId(),
                    "Admin created and approved official verifier account for " + cleanEmail, null);
        }

        log.info("Verifier account {} successfully created and approved by admin {}", cleanEmail, adminId);
        return toAdminUserDto(savedVerifier);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserDto> getVerifiers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.VERIFIER)
                .map(this::toAdminUserDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminAssetDto> getAllAssets(String search, String category, Pageable pageable) {
        Page<DigitalAsset> assetsPage;

        if (search != null && !search.isBlank()) {
            assetsPage = digitalAssetRepository.findByNameContainingIgnoreCase(search, pageable);
        } else if (category != null && !category.isBlank()) {
            assetsPage = digitalAssetRepository.findByCategory_NameContainingIgnoreCase(category, pageable);
        } else {
            assetsPage = digitalAssetRepository.findAll(pageable);
        }

        return assetsPage.map(this::toAdminAssetDto);
    }

    @Override
    @Transactional(readOnly = true)
    public AssetResponseDto getAssetDetails(Long assetId) {
        DigitalAsset asset = digitalAssetRepository.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with ID: " + assetId));
        return assetService.getAssetById(asset.getUser().getId(), assetId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BeneficiaryResponseDto> getAllBeneficiaries(String search, Pageable pageable) {
        Page<Beneficiary> beneficiariesPage;

        if (search != null && !search.isBlank()) {
            beneficiariesPage = beneficiaryRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                    search, search, pageable);
        } else {
            beneficiariesPage = beneficiaryRepository.findAll(pageable);
        }

        return beneficiariesPage.map(this::toBeneficiaryDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VerificationRecordDto> getVerifications(String status, Pageable pageable) {
        Page<VerificationRecord> records;

        if (status != null && !status.isBlank()) {
            try {
                VerificationRecordStatus vrs = VerificationRecordStatus.valueOf(status.toUpperCase());
                records = verificationRecordRepository.findByStatus(vrs, pageable);
            } catch (IllegalArgumentException e) {
                records = verificationRecordRepository.findAll(pageable);
            }
        } else {
            records = verificationRecordRepository.findAll(pageable);
        }

        return records.map(this::toVerificationDto);
    }

    @Override
    @Transactional
    public VerificationRecordDto approveVerification(Long id, Long adminId, String notes) {
        VerificationRecord record = verificationRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Verification record not found with id: " + id));

        if (record.getStatus() != VerificationRecordStatus.PENDING) {
            throw new IllegalStateException("Verification can only be approved when in PENDING status");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        record.setStatus(VerificationRecordStatus.APPROVED);
        record.setVerifierAdmin(admin);
        record.setVerifiedAt(LocalDateTime.now());
        verificationRecordRepository.save(record);

        // Update beneficiary verification status
        Beneficiary beneficiary = record.getBeneficiary();
        beneficiary.setVerificationStatus(VerificationStatus.VERIFIED);
        beneficiaryRepository.save(beneficiary);

        auditService.logAdminAction(admin, "APPROVE_VERIFICATION", "VerificationRecord", id,
                "Approved verification for beneficiary: " + beneficiary.getFullName(), null);

        return toVerificationDto(record);
    }

    @Override
    @Transactional
    public VerificationRecordDto rejectVerification(Long id, Long adminId, String reason) {
        VerificationRecord record = verificationRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Verification record not found with id: " + id));

        if (record.getStatus() != VerificationRecordStatus.PENDING) {
            throw new IllegalStateException("Verification can only be rejected when in PENDING status");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        record.setStatus(VerificationRecordStatus.REJECTED);
        record.setVerifierAdmin(admin);
        record.setRejectionReason(reason);
        record.setVerifiedAt(LocalDateTime.now());
        verificationRecordRepository.save(record);

        // Update beneficiary verification status
        Beneficiary beneficiary = record.getBeneficiary();
        beneficiary.setVerificationStatus(VerificationStatus.REJECTED);
        beneficiaryRepository.save(beneficiary);

        auditService.logAdminAction(admin, "REJECT_VERIFICATION", "VerificationRecord", id,
                "Rejected verification for beneficiary: " + beneficiary.getFullName() + ". Reason: " + reason, null);

        return toVerificationDto(record);
    }

    @Override
    @Transactional(readOnly = true)
    public org.springframework.core.io.Resource loadVerificationDocument(Long id, Long adminId) {
        VerificationRecord record = verificationRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Verification record not found with id: " + id));
        if (record.getDocumentFile() == null) {
            throw new ResourceNotFoundException("No document attached to this verification record");
        }
        return fileStorageService.loadFileAsResource(record.getDocumentFile().getId(), adminId, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminAuditLogDto> getAuditLogs(Long adminId, Pageable pageable) {
        Page<AdminAuditLog> logs;

        if (adminId != null) {
            logs = adminAuditLogRepository.findByAdminId(adminId, pageable);
        } else {
            logs = adminAuditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        return logs.map(this::toAuditLogDto);
    }

    @Override
    @Transactional(readOnly = true)
    public SystemSettingDto getSetting(String key) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found: " + key));
        return toSettingDto(setting);
    }

    @Override
    @Transactional
    public SystemSettingDto updateSetting(String key, String value, Long adminId) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found: " + key));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        String oldValue = setting.getSettingValue();
        setting.setSettingValue(value);
        setting.setUpdatedByAdmin(admin);
        systemSettingRepository.save(setting);

        auditService.logAdminAction(admin, "UPDATE_SETTING", "SystemSetting", setting.getId(),
                "Changed setting '" + key + "' from '" + oldValue + "' to '" + value + "'", null);

        return toSettingDto(setting);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemSettingDto> getAllSettings() {
        return systemSettingRepository.findAll().stream()
                .map(this::toSettingDto)
                .collect(Collectors.toList());
    }

    // ===== Mapping Methods =====

    private AdminUserDto toAdminUserDto(User user) {
        String fullName = user.getProfile() != null ? user.getProfile().getFullName() : user.getEmail();
        String phone = user.getProfile() != null ? user.getProfile().getPhoneNumber() : null;

        return AdminUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(fullName)
                .phoneNumber(phone)
                .role(user.getRole())
                .status(user.getStatus())
                .assetCount(digitalAssetRepository.countByUserId(user.getId()))
                .beneficiaryCount(beneficiaryRepository.countByOwnerId(user.getId()))
                .pendingRequestCount(emergencyRequestRepository.countByOwnerIdAndStatus(
                        user.getId(), EmergencyRequestStatus.PENDING))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private AdminAssetDto toAdminAssetDto(DigitalAsset asset) {
        String ownerName = asset.getUser().getProfile() != null
                ? asset.getUser().getProfile().getFullName() : asset.getUser().getEmail();

        return AdminAssetDto.builder()
                .id(asset.getId())
                .assetName(asset.getName())
                .categoryName(asset.getCategory() != null ? asset.getCategory().getName() : "Unknown")
                .platformName(asset.getPlatformName())
                .status(asset.getStatus())
                .ownerId(asset.getUser().getId())
                .ownerEmail(asset.getUser().getEmail())
                .ownerName(ownerName)
                .beneficiaryCount(asset.getAssetBeneficiaries() != null ? asset.getAssetBeneficiaries().size() : 0)
                .createdAt(asset.getCreatedAt())
                .updatedAt(asset.getUpdatedAt())
                .build();
    }

    private BeneficiaryResponseDto toBeneficiaryDto(Beneficiary b) {
        return BeneficiaryResponseDto.builder()
                .id(b.getId())
                .fullName(b.getFullName())
                .email(b.getEmail())
                .phoneNumber(b.getPhoneNumber())
                .relationship(b.getRelationship())
                .address(b.getAddress())
                .verificationStatus(b.getVerificationStatus())
                .assignedAssetsCount(b.getAssetBeneficiaries() != null ? b.getAssetBeneficiaries().size() : 0)
                .createdAt(b.getCreatedAt())
                .build();
    }

    private VerificationRecordDto toVerificationDto(VerificationRecord vr) {
        return VerificationRecordDto.builder()
                .id(vr.getId())
                .beneficiaryId(vr.getBeneficiary().getId())
                .beneficiaryName(vr.getBeneficiary().getFullName())
                .beneficiaryEmail(vr.getBeneficiary().getEmail())
                .ownerUserId(vr.getBeneficiary().getOwner().getId())
                .ownerEmail(vr.getBeneficiary().getOwner().getEmail())
                .verificationType(vr.getVerificationType())
                .documentFileId(vr.getDocumentFile() != null ? vr.getDocumentFile().getId() : null)
                .documentFileName(vr.getDocumentFile() != null ? vr.getDocumentFile().getFileName() : null)
                .documentFileSize(vr.getDocumentFile() != null ? vr.getDocumentFile().getFileSize() : null)
                .status(vr.getStatus().name())
                .rejectionReason(vr.getRejectionReason())
                .verifierAdminId(vr.getVerifierAdmin() != null ? vr.getVerifierAdmin().getId() : null)
                .verifierAdminEmail(vr.getVerifierAdmin() != null ? vr.getVerifierAdmin().getEmail() : null)
                .verifiedAt(vr.getVerifiedAt())
                .createdAt(vr.getCreatedAt())
                .updatedAt(vr.getUpdatedAt())
                .build();
    }

    private AdminAuditLogDto toAuditLogDto(AdminAuditLog log) {
        return AdminAuditLogDto.builder()
                .id(log.getId())
                .adminId(log.getAdmin().getId())
                .adminEmail(log.getAdmin().getEmail())
                .action(log.getAction())
                .targetEntity(log.getTargetEntity())
                .targetId(log.getTargetId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private SystemSettingDto toSettingDto(SystemSetting s) {
        return SystemSettingDto.builder()
                .id(s.getId())
                .settingKey(s.getSettingKey())
                .settingValue(s.getSettingValue())
                .description(s.getDescription())
                .build();
    }
}
