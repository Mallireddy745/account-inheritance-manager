package com.digitallegacy.controller;

import com.digitallegacy.dto.request.EmergencyRequestReviewDto;
import com.digitallegacy.dto.response.*;
import com.digitallegacy.entity.enums.EmergencyRequestStatus;
import com.digitallegacy.entity.enums.UserStatus;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.AdminService;
import com.digitallegacy.service.EmergencyRequestService;
import com.digitallegacy.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN') and authentication.name == 'admin@digitallegacy.com'")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final EmergencyRequestService emergencyRequestService;
    private final FileStorageService fileStorageService;

    // ===== Dashboard =====

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getDashboard() {
        AdminDashboardDto dashboard = adminService.getDashboard();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard data retrieved", dashboard));
    }

    // ===== User Management =====

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminUserDto>>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserStatus status,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<AdminUserDto> users = adminService.getAllUsers(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserDto>> getUserDetails(@PathVariable Long id) {
        AdminUserDto user = adminService.getUserDetails(id);
        return ResponseEntity.ok(ApiResponse.success("User details retrieved", user));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<AdminUserDto>> changeUserStatus(
            @PathVariable Long id,
            @RequestParam UserStatus status,
            @AuthenticationPrincipal UserPrincipal principal) {

        AdminUserDto user = adminService.changeUserStatus(id, status, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("User status updated to " + status, user));
    }

    // ===== Verifier Provisioning =====

    @PostMapping("/verifiers")
    public ResponseEntity<ApiResponse<AdminUserDto>> createVerifier(
            @jakarta.validation.Valid @RequestBody com.digitallegacy.dto.request.CreateVerifierRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {

        AdminUserDto verifier = adminService.createVerifier(request, principal.getId());
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Verifier account successfully created and approved", verifier));
    }

    @GetMapping("/verifiers")
    public ResponseEntity<ApiResponse<List<AdminUserDto>>> getVerifiers() {
        List<AdminUserDto> verifiers = adminService.getVerifiers();
        return ResponseEntity.ok(ApiResponse.success("Verifier accounts retrieved", verifiers));
    }

    // ===== Asset Management =====

    @GetMapping("/assets")
    public ResponseEntity<ApiResponse<Page<AdminAssetDto>>> getAllAssets(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<AdminAssetDto> assets = adminService.getAllAssets(search, category, pageable);
        return ResponseEntity.ok(ApiResponse.success("Assets retrieved", assets));
    }

    @GetMapping("/assets/{id}")
    public ResponseEntity<ApiResponse<AssetResponseDto>> getAssetDetails(@PathVariable Long id) {
        AssetResponseDto asset = adminService.getAssetDetails(id);
        return ResponseEntity.ok(ApiResponse.success("Asset details retrieved", asset));
    }

    @GetMapping("/assets/{id}/download-file/{fileId}")
    public ResponseEntity<Resource> downloadAssetFile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @PathVariable Long fileId) {

        Resource resource = fileStorageService.loadFileAsResource(fileId, principal.getId(), true);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    // ===== Beneficiary Management =====

    @GetMapping("/beneficiaries")
    public ResponseEntity<ApiResponse<Page<BeneficiaryResponseDto>>> getAllBeneficiaries(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<BeneficiaryResponseDto> beneficiaries = adminService.getAllBeneficiaries(search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Beneficiaries retrieved", beneficiaries));
    }

    // ===== Emergency Requests =====

    @GetMapping("/emergency-requests")
    public ResponseEntity<ApiResponse<Page<EmergencyRequestDto>>> getAllEmergencyRequests(
            @RequestParam(required = false) EmergencyRequestStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String claimType,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<EmergencyRequestDto> requests = emergencyRequestService.getAllRequestsFiltered(status, search, claimType, pageable);
        return ResponseEntity.ok(ApiResponse.success("Emergency requests retrieved", requests));
    }

    @PatchMapping("/emergency-requests/{id}/approve")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> approveEmergencyRequest(
            @PathVariable Long id,
            @RequestBody(required = false) EmergencyRequestReviewDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {

        String notes = dto != null ? dto.getAdminNotes() : null;
        EmergencyRequestDto result = emergencyRequestService.approveRequest(id, principal.getId(), notes);
        return ResponseEntity.ok(ApiResponse.success("Emergency request approved", result));
    }

    @PatchMapping("/emergency-requests/{id}/reject")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> rejectEmergencyRequest(
            @PathVariable Long id,
            @RequestBody(required = false) EmergencyRequestReviewDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {

        String reason = dto != null ? dto.getRejectionReason() : null;
        EmergencyRequestDto result = emergencyRequestService.rejectRequest(id, principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.success("Emergency request rejected", result));
    }

    @GetMapping("/emergency-requests/{id}/evidence")
    public ResponseEntity<Resource> downloadEmergencyRequestEvidence(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        Resource resource = emergencyRequestService.loadEvidenceDocument(id, principal.getId(), true);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    // ===== Verifications =====

    @GetMapping("/verifications")
    public ResponseEntity<ApiResponse<Page<VerificationRecordDto>>> getVerifications(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<VerificationRecordDto> records = adminService.getVerifications(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Verification records retrieved", records));
    }

    @PatchMapping("/verifications/{id}/approve")
    public ResponseEntity<ApiResponse<VerificationRecordDto>> approveVerification(
            @PathVariable Long id,
            @RequestBody(required = false) EmergencyRequestReviewDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {

        String notes = dto != null ? dto.getAdminNotes() : null;
        VerificationRecordDto result = adminService.approveVerification(id, principal.getId(), notes);
        return ResponseEntity.ok(ApiResponse.success("Verification approved", result));
    }

    @PatchMapping("/verifications/{id}/reject")
    public ResponseEntity<ApiResponse<VerificationRecordDto>> rejectVerification(
            @PathVariable Long id,
            @RequestBody(required = false) EmergencyRequestReviewDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {

        String reason = dto != null ? dto.getRejectionReason() : null;
        VerificationRecordDto result = adminService.rejectVerification(id, principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.success("Verification rejected", result));
    }

    @GetMapping("/verifications/{id}/document")
    public ResponseEntity<Resource> downloadVerificationDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        Resource resource = adminService.loadVerificationDocument(id, principal.getId());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    // ===== Audit Logs =====

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AdminAuditLogDto>>> getAuditLogs(
            @RequestParam(required = false) Long adminId,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<AdminAuditLogDto> logs = adminService.getAuditLogs(adminId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved", logs));
    }

    // ===== System Settings =====

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<List<SystemSettingDto>>> getAllSettings() {
        List<SystemSettingDto> settings = adminService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success("Settings retrieved", settings));
    }

    @GetMapping("/settings/{key}")
    public ResponseEntity<ApiResponse<SystemSettingDto>> getSetting(@PathVariable String key) {
        SystemSettingDto setting = adminService.getSetting(key);
        return ResponseEntity.ok(ApiResponse.success("Setting retrieved", setting));
    }

    @PutMapping("/settings/{key}")
    public ResponseEntity<ApiResponse<SystemSettingDto>> updateSetting(
            @PathVariable String key,
            @RequestParam String value,
            @AuthenticationPrincipal UserPrincipal principal) {

        SystemSettingDto setting = adminService.updateSetting(key, value, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Setting updated", setting));
    }
}
