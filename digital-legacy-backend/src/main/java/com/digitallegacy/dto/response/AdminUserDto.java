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
public class AdminUserDto {

    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private Role role;
    private UserStatus status;
    private long assetCount;
    private long beneficiaryCount;
    private long pendingRequestCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
