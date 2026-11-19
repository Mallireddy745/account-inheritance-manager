package com.digitallegacy.controller;

import com.digitallegacy.dto.request.PermissionRequestDto;
import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.PermissionResponseDto;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@Tag(name = "Asset Permissions Management", description = "Endpoints for managing granular beneficiary access rights and revocation")
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping
    @Operation(summary = "List all permissions configured by the authenticated user")
    public ResponseEntity<ApiResponse<List<PermissionResponseDto>>> getUserPermissions(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<PermissionResponseDto> permissions = permissionService.getUserPermissions(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Permissions retrieved successfully", permissions));
    }

    @PostMapping
    @Operation(summary = "Grant access permission on an asset to a beneficiary")
    public ResponseEntity<ApiResponse<PermissionResponseDto>> grantPermission(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody PermissionRequestDto request) {

        PermissionResponseDto response = permissionService.grantPermission(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Permission granted successfully", response));
    }

    @PatchMapping("/{id}/revoke")
    @Operation(summary = "Revoke access permission")
    public ResponseEntity<ApiResponse<PermissionResponseDto>> revokePermission(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        PermissionResponseDto response = permissionService.revokePermission(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Permission revoked successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete permission record")
    public ResponseEntity<ApiResponse<Void>> deletePermission(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        permissionService.deletePermission(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Permission deleted successfully"));
    }
}
