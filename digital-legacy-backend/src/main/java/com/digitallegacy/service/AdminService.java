package com.digitallegacy.service;

import com.digitallegacy.dto.response.*;
import com.digitallegacy.entity.enums.UserStatus;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminService {

    AdminDashboardDto getDashboard();

    Page<AdminUserDto> getAllUsers(String search, UserStatus status, Pageable pageable);

    AdminUserDto getUserDetails(Long userId);

    AdminUserDto changeUserStatus(Long userId, UserStatus newStatus, Long adminId);

    AdminUserDto createVerifier(com.digitallegacy.dto.request.CreateVerifierRequestDto request, Long adminId);

    List<AdminUserDto> getVerifiers();

    Page<AdminAssetDto> getAllAssets(String search, String category, Pageable pageable);

    AssetResponseDto getAssetDetails(Long assetId);

    Page<BeneficiaryResponseDto> getAllBeneficiaries(String search, Pageable pageable);

    Page<VerificationRecordDto> getVerifications(String status, Pageable pageable);

    VerificationRecordDto approveVerification(Long id, Long adminId, String notes);

    VerificationRecordDto rejectVerification(Long id, Long adminId, String reason);

    Resource loadVerificationDocument(Long id, Long adminId);

    Page<AdminAuditLogDto> getAuditLogs(Long adminId, Pageable pageable);

    SystemSettingDto getSetting(String key);

    SystemSettingDto updateSetting(String key, String value, Long adminId);

    List<SystemSettingDto> getAllSettings();
}
