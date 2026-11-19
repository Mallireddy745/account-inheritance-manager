package com.digitallegacy.controller;

import com.digitallegacy.dto.request.LoginRequest;
import com.digitallegacy.dto.request.RegisterRequest;
import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.AuthResponse;
import com.digitallegacy.dto.response.UserProfileDto;
import com.digitallegacy.entity.User;
import com.digitallegacy.repository.UserRepository;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.AuditService;
import com.digitallegacy.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Authorization", description = "Endpoints for user registration, login, admin authentication, and session identity")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user account (Role: OWNER)")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.register(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User account registered successfully", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and generate JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", response));
    }

    @PostMapping("/admin-login")
    @Operation(summary = "Dedicated Administrator Login with backend role verification")
    public ResponseEntity<ApiResponse<AuthResponse>> adminLogin(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.adminLogin(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Admin authentication successful", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserProfileDto profile = authService.getCurrentUser(currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Profile fetched successfully", profile));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user and record logout activity")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest httpRequest) {
        if (currentUser != null) {
            userRepository.findByEmail(currentUser.getUsername()).ifPresent(user -> {
                String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
                String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "Unknown";
                auditService.logUserActivity(user, "USER_LOGOUT", "User logged out successfully", ip, userAgent);
            });
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }
}
