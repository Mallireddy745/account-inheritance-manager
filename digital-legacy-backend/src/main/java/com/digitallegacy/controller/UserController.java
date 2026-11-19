package com.digitallegacy.controller;

import com.digitallegacy.dto.request.ChangePasswordRequestDto;
import com.digitallegacy.dto.request.ProfileUpdateRequestDto;
import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.UserProfileDto;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile & Account Settings", description = "Endpoints for viewing and updating user profile information and credentials")
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    @Operation(summary = "Get authenticated user profile details")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        UserProfileDto profile = userService.getUserProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update personal profile details")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ProfileUpdateRequestDto request) {

        UserProfileDto updated = userService.updateUserProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change user account password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody ChangePasswordRequestDto request) {

        userService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}
