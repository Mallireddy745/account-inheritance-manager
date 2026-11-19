package com.digitallegacy.service;

import com.digitallegacy.dto.request.ChangePasswordRequestDto;
import com.digitallegacy.dto.request.ProfileUpdateRequestDto;
import com.digitallegacy.dto.response.UserProfileDto;

public interface UserService {

    UserProfileDto getUserProfile(Long userId);

    UserProfileDto updateUserProfile(Long userId, ProfileUpdateRequestDto request);

    void changePassword(Long userId, ChangePasswordRequestDto request);
}
