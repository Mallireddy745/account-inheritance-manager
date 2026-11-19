package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.Role;
import com.digitallegacy.entity.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {

    private Long userId;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    private String address;
    private Role role;
    private UserStatus status;
    private Boolean emailVerified;
    private Boolean phoneVerified;
    private LocalDateTime registeredAt;
}
