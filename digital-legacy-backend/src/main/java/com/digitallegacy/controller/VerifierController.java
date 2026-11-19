package com.digitallegacy.controller;

import com.digitallegacy.dto.request.EmergencyRequestReviewDto;
import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.EmergencyRequestDto;
import com.digitallegacy.entity.enums.EmergencyRequestStatus;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.EmergencyRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/verifier")
@PreAuthorize("hasAnyRole('VERIFIER', 'ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Verifier Panel", description = "Endpoints for independent legal and estate verification officers to review inheritance claims")
public class VerifierController {

    private final EmergencyRequestService emergencyRequestService;

    @GetMapping("/requests")
    @Operation(summary = "List all inheritance access claims with optional status, search, and claim type filtering")
    public ResponseEntity<ApiResponse<Page<EmergencyRequestDto>>> getInheritanceRequests(
            @RequestParam(required = false) EmergencyRequestStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String claimType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<EmergencyRequestDto> requests = emergencyRequestService.getAllRequestsFiltered(status, search, claimType, pageable);
        return ResponseEntity.ok(ApiResponse.success("Inheritance requests retrieved", requests));
    }

    @GetMapping("/requests/{id}")
    @Operation(summary = "Get detailed information for an inheritance access claim")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> getRequestById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        EmergencyRequestDto dto = emergencyRequestService.getRequestById(id, principal.getId(), true);
        return ResponseEntity.ok(ApiResponse.success("Claim details retrieved", dto));
    }

    @PatchMapping("/requests/{id}/under-review")
    @Operation(summary = "Mark an inheritance request as UNDER_REVIEW")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> markUnderReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        EmergencyRequestDto dto = emergencyRequestService.markUnderReview(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Claim marked under review", dto));
    }

    @PatchMapping("/requests/{id}/approve")
    @Operation(summary = "Approve an inheritance request and grant access to authorized estate assets")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> approveRequest(
            @PathVariable Long id,
            @RequestBody(required = false) EmergencyRequestReviewDto reviewDto,
            @AuthenticationPrincipal UserPrincipal principal) {

        String notes = reviewDto != null && reviewDto.getAdminNotes() != null
                ? reviewDto.getAdminNotes()
                : (reviewDto != null ? reviewDto.getVerificationNotes() : "Verified and approved");

        EmergencyRequestDto dto = emergencyRequestService.approveRequest(id, principal.getId(), notes);
        return ResponseEntity.ok(ApiResponse.success("Inheritance request approved and access granted", dto));
    }

    @PatchMapping("/requests/{id}/reject")
    @Operation(summary = "Reject an inheritance access claim")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) EmergencyRequestReviewDto reviewDto,
            @AuthenticationPrincipal UserPrincipal principal) {

        String reason = reviewDto != null && reviewDto.getRejectionReason() != null
                ? reviewDto.getRejectionReason()
                : (reviewDto != null ? reviewDto.getVerificationNotes() : "Claim rejected by verifier");

        EmergencyRequestDto dto = emergencyRequestService.rejectRequest(id, principal.getId(), reason);
        return ResponseEntity.ok(ApiResponse.success("Inheritance request rejected", dto));
    }

    @PatchMapping("/requests/{id}/request-info")
    @Operation(summary = "Request additional documentation or information from the beneficiary")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> requestAdditionalInfo(
            @PathVariable Long id,
            @RequestBody EmergencyRequestReviewDto reviewDto,
            @AuthenticationPrincipal UserPrincipal principal) {

        String notes = reviewDto != null && reviewDto.getVerificationNotes() != null
                ? reviewDto.getVerificationNotes()
                : (reviewDto != null ? reviewDto.getAdminNotes() : "Additional documentation required");

        EmergencyRequestDto dto = emergencyRequestService.requestAdditionalInfo(id, principal.getId(), notes);
        return ResponseEntity.ok(ApiResponse.success("Additional information requested from beneficiary", dto));
    }

    @GetMapping("/requests/{id}/evidence")
    @Operation(summary = "Download uploaded supporting legal or medical evidence document")
    public ResponseEntity<Resource> downloadEvidenceFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        Resource resource = emergencyRequestService.loadEvidenceDocument(id, principal.getId(), true);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
