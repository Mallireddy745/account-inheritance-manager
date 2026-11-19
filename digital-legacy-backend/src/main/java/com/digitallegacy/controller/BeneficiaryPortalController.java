package com.digitallegacy.controller;

import com.digitallegacy.dto.request.EmergencyRequestCreateDto;
import com.digitallegacy.dto.response.*;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.BeneficiaryPortalService;
import com.digitallegacy.service.EmergencyRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiary-portal")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
@Tag(name = "Beneficiary Portal", description = "Endpoints for beneficiaries to access invitations, owners, inherited assets, vault documents, and inheritance claims")
public class BeneficiaryPortalController {

    private final BeneficiaryPortalService beneficiaryPortalService;
    private final EmergencyRequestService emergencyRequestService;

    @GetMapping("/summary")
    @Operation(summary = "Get beneficiary portal overview summary metrics")
    public ResponseEntity<ApiResponse<BeneficiaryPortalSummaryDto>> getPortalSummary(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        BeneficiaryPortalSummaryDto summary = beneficiaryPortalService.getPortalSummary(
                currentUser.getId(), currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Beneficiary portal summary retrieved", summary));
    }

    @GetMapping("/invitations")
    @Operation(summary = "Get all inheritance invitations sent to this beneficiary")
    public ResponseEntity<ApiResponse<List<BeneficiaryInvitationDto>>> getMyInvitations(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<BeneficiaryInvitationDto> list = beneficiaryPortalService.getMyInvitations(
                currentUser.getId(), currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Invitations retrieved", list));
    }

    @PostMapping("/invitations/{id}/accept")
    @Operation(summary = "Accept an inheritance nomination invitation from an owner")
    public ResponseEntity<ApiResponse<Void>> acceptInvitation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        beneficiaryPortalService.acceptInvitation(id, currentUser.getId(), currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Invitation accepted successfully"));
    }

    @PostMapping("/invitations/{id}/decline")
    @Operation(summary = "Decline an inheritance nomination invitation from an owner")
    public ResponseEntity<ApiResponse<Void>> declineInvitation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        beneficiaryPortalService.declineInvitation(id, currentUser.getId(), currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Invitation declined"));
    }

    @GetMapping("/owners")
    @Operation(summary = "List all estate owners who nominated this beneficiary")
    public ResponseEntity<ApiResponse<List<OwnerProfileSummaryDto>>> getMyOwners(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<OwnerProfileSummaryDto> list = beneficiaryPortalService.getMyOwners(
                currentUser.getId(), currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Estate owners retrieved", list));
    }

    @GetMapping("/assets")
    @Operation(summary = "Get all digital assets designated to this beneficiary across all estate owners")
    public ResponseEntity<ApiResponse<List<InheritedAssetDto>>> getInheritedAssets(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<InheritedAssetDto> assets = beneficiaryPortalService.getInheritedAssets(
                currentUser.getId(), currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Inherited assets retrieved successfully", assets));
    }

    @GetMapping("/authorized-documents")
    @Operation(summary = "Get unlocked assets and authorized vault documents once access has been approved")
    public ResponseEntity<ApiResponse<List<InheritedAssetDto>>> getAuthorizedDocuments(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<InheritedAssetDto> assets = beneficiaryPortalService.getAuthorizedDocuments(
                currentUser.getId(), currentUser.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Authorized documents retrieved", assets));
    }

    @GetMapping("/assets/{assetId}/download-file/{fileId}")
    @Operation(summary = "Download supporting document for an inherited asset with permission or approved claim")
    public ResponseEntity<Resource> downloadInheritedFile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long assetId,
            @PathVariable Long fileId) {

        Resource resource = beneficiaryPortalService.downloadInheritedFile(
                currentUser.getId(), currentUser.getEmail(), assetId, fileId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @PostMapping("/upload-supporting-doc")
    @Operation(summary = "Upload supporting document (death certificate, power of attorney, legal/medical file)")
    public ResponseEntity<ApiResponse<UploadedFileDto>> uploadSupportingDocument(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        UploadedFileDto uploaded = beneficiaryPortalService.uploadSupportingDocument(file, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Supporting document uploaded successfully", uploaded));
    }

    @PostMapping("/claims")
    @Operation(summary = "Submit an emergency or inheritance access claim")
    public ResponseEntity<ApiResponse<EmergencyRequestDto>> submitEmergencyClaim(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody EmergencyRequestCreateDto request) {

        EmergencyRequestDto claim = emergencyRequestService.submitRequest(request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Inheritance access claim submitted for verification review", claim));
    }

    @GetMapping("/claims")
    @Operation(summary = "Get all inheritance claims submitted by this beneficiary")
    public ResponseEntity<ApiResponse<Page<EmergencyRequestDto>>> getMyClaims(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<EmergencyRequestDto> claims = emergencyRequestService.getRequestsByBeneficiaryUser(currentUser.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Beneficiary inheritance claims retrieved", claims));
    }
}
