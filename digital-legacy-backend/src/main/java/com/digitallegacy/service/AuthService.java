package com.digitallegacy.service;

import com.digitallegacy.dto.request.LoginRequest;
import com.digitallegacy.dto.request.RegisterRequest;
import com.digitallegacy.dto.response.AuthResponse;
import com.digitallegacy.dto.response.UserProfileDto;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest);

    AuthResponse login(LoginRequest request, HttpServletRequest httpRequest);

    AuthResponse adminLogin(LoginRequest request, HttpServletRequest httpRequest);

    UserProfileDto getCurrentUser(String email);
}
