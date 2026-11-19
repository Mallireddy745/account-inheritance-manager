package com.digitallegacy.dto.request;

import com.digitallegacy.entity.enums.PermissionType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionRequestDto {

    @NotNull(message = "Asset ID is required")
    private Long assetId;

    @NotNull(message = "Beneficiary ID is required")
    private Long beneficiaryId;

    @NotNull(message = "Permission type is required")
    private PermissionType permissionType;

    private LocalDateTime effectiveFrom;

    private LocalDateTime expiresAt;

    private String accessCondition;
}
