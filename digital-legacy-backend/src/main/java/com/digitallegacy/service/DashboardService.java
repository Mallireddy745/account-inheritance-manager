package com.digitallegacy.service;

import com.digitallegacy.dto.response.UserDashboardDto;

public interface DashboardService {

    UserDashboardDto getUserDashboard(Long userId);
}
