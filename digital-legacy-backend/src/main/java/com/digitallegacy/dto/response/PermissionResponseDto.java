package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.PermissionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponseDto {

    private Long id;
    private Long assetId;
    private String assetName;
    private Long beneficiaryId;
    private String beneficiaryName;
    private String beneficiaryEmail;
    private PermissionType permissionType;
    private Boolean isRevoked;
    private LocalDateTime effectiveFrom;
    private LocalDateTime expiresAt;
    private String accessCondition;
    private LocalDateTime createdAt;
}
