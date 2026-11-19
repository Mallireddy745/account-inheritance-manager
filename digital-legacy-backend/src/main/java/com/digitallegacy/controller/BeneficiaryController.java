package com.digitallegacy.controller;

import com.digitallegacy.dto.request.BeneficiaryRequestDto;
import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.BeneficiaryResponseDto;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.BeneficiaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/beneficiaries")
@RequiredArgsConstructor
@Tag(name = "Beneficiaries Management", description = "Endpoints for managing trusted beneficiaries and transfer allocations")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    @GetMapping
    @Operation(summary = "List all beneficiaries added by the authenticated user")
    public ResponseEntity<ApiResponse<Page<BeneficiaryResponseDto>>> getUserBeneficiaries(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<BeneficiaryResponseDto> beneficiaries = beneficiaryService.getUserBeneficiaries(currentUser.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Beneficiaries retrieved successfully", beneficiaries));
    }

    @PostMapping
    @Operation(summary = "Add a new beneficiary")
    public ResponseEntity<ApiResponse<BeneficiaryResponseDto>> createBeneficiary(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody BeneficiaryRequestDto request) {

        BeneficiaryResponseDto response = beneficiaryService.createBeneficiary(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Beneficiary added successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve beneficiary details by ID")
    public ResponseEntity<ApiResponse<BeneficiaryResponseDto>> getBeneficiaryById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        BeneficiaryResponseDto beneficiary = beneficiaryService.getBeneficiaryById(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Beneficiary details retrieved successfully", beneficiary));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update beneficiary details")
    public ResponseEntity<ApiResponse<BeneficiaryResponseDto>> updateBeneficiary(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody BeneficiaryRequestDto request) {

        BeneficiaryResponseDto updated = beneficiaryService.updateBeneficiary(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Beneficiary updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete beneficiary")
    public ResponseEntity<ApiResponse<Void>> deleteBeneficiary(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        beneficiaryService.deleteBeneficiary(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Beneficiary deleted successfully"));
    }

    @GetMapping("/{id}/requests")
    @Operation(summary = "Get inheritance access requests for this beneficiary")
    public ResponseEntity<ApiResponse<Page<com.digitallegacy.dto.response.EmergencyRequestDto>>> getBeneficiaryRequests(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<com.digitallegacy.dto.response.EmergencyRequestDto> requests =
                beneficiaryService.getRequestsForBeneficiary(currentUser.getId(), id, pageable);
        return ResponseEntity.ok(ApiResponse.success("Beneficiary requests retrieved", requests));
    }

    @PostMapping("/{id}/resend-invitation")
    @Operation(summary = "Resend invitation to beneficiary")
    public ResponseEntity<ApiResponse<BeneficiaryResponseDto>> resendInvitation(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        BeneficiaryResponseDto response = beneficiaryService.resendInvitation(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Invitation resent successfully", response));
    }
}
