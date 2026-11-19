package com.digitallegacy.controller;

import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.UserDashboardDto;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/dashboard")
@RequiredArgsConstructor
@Tag(name = "User Dashboard", description = "Endpoints for user statistics, asset category breakdowns, and activity feeds")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Get aggregated dashboard statistics for the authenticated user")
    public ResponseEntity<ApiResponse<UserDashboardDto>> getDashboard(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        UserDashboardDto dashboard = dashboardService.getUserDashboard(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics loaded successfully", dashboard));
    }
}
