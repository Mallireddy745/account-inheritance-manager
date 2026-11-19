package com.digitallegacy.service.impl;

import com.digitallegacy.dto.request.ChangePasswordRequestDto;
import com.digitallegacy.dto.request.ProfileUpdateRequestDto;
import com.digitallegacy.dto.response.UserProfileDto;
import com.digitallegacy.entity.User;
import com.digitallegacy.entity.UserProfile;
import com.digitallegacy.exception.ResourceNotFoundException;
import com.digitallegacy.repository.UserProfileRepository;
import com.digitallegacy.repository.UserRepository;
import com.digitallegacy.service.AuditService;
import com.digitallegacy.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        return mapToDto(user);
    }

    @Override
    @Transactional
    public UserProfileDto updateUserProfile(Long userId, ProfileUpdateRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = UserProfile.builder()
                    .user(user)
                    .fullName(request.getFullName().trim())
                    .build();
        } else {
            profile.setFullName(request.getFullName().trim());
        }

        profile.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null);
        profile.setAddress(request.getAddress());
        profile.setAvatarUrl(request.getAvatarUrl());

        userProfileRepository.save(profile);

        auditService.logUserActivity(user, "PROFILE_UPDATED", "Updated personal profile information", null, null);

        return mapToDto(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password provided does not match our records.");
        }

        String confirm = request.getConfirmNewPassword();
        if (confirm != null && !confirm.isBlank() && !request.getNewPassword().equals(confirm)) {
            throw new IllegalArgumentException("New password and confirmation do not match.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("New password cannot be the same as the current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.logUserActivity(user, "PASSWORD_CHANGED", "Account password changed successfully", null, null);
    }

    private UserProfileDto mapToDto(User user) {
        UserProfile p = user.getProfile();
        return UserProfileDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(p != null ? p.getFullName() : "")
                .phoneNumber(p != null ? p.getPhoneNumber() : null)
                .avatarUrl(p != null ? p.getAvatarUrl() : null)
                .address(p != null ? p.getAddress() : null)
                .role(user.getRole())
                .status(user.getStatus())
                .emailVerified(p != null ? p.getEmailVerified() : false)
                .phoneVerified(p != null ? p.getPhoneVerified() : false)
                .registeredAt(user.getCreatedAt())
                .build();
    }
}
