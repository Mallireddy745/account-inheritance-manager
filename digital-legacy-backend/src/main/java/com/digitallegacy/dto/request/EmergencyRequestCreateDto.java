package com.digitallegacy.dto.request;

import com.digitallegacy.entity.enums.ClaimType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequestCreateDto {

    private Long assetId;

    private Long beneficiaryId;

    private Long ownerId;

    private ClaimType claimType;

    private Long evidenceFileId;

    @NotBlank(message = "Reason is required")
    @Size(max = 2000, message = "Reason must be at most 2000 characters")
    private String reason;
}
