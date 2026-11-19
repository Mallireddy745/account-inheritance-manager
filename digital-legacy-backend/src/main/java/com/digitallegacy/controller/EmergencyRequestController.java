package com.digitallegacy.controller;

import com.digitallegacy.dto.request.EmergencyRequestCreateDto;
import com.digitallegacy.dto.request.EmergencyRequestReviewDto;
import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.EmergencyRequestDto;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.EmergencyRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/emergency-requests")
@RequiredArgsConstructor
public class EmergencyRequestController {

    private final EmergencyRequestService emergencyRequestService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> submitRequest(
            @Valid @RequestBody EmergencyRequestCreateDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {

        EmergencyRequestDto result = emergencyRequestService.submitRequest(dto, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Emergency request submitted successfully", result));
    }

    @GetMapping("/owner")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<EmergencyRequestDto>>> getOwnerRequests(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<EmergencyRequestDto> result = emergencyRequestService.getRequestsByOwner(principal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Owner emergency requests retrieved", result));
    }

    @GetMapping("/beneficiary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<EmergencyRequestDto>>> getBeneficiaryRequests(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<EmergencyRequestDto> result = emergencyRequestService.getRequestsByBeneficiaryUser(principal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Beneficiary emergency requests retrieved", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> getRequestById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        EmergencyRequestDto result = emergencyRequestService.getRequestById(id, principal.getId(), false);
        return ResponseEntity.ok(ApiResponse.success("Emergency request retrieved", result));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> cancelRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        EmergencyRequestDto result = emergencyRequestService.cancelRequest(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Emergency request cancelled", result));
    }
}
