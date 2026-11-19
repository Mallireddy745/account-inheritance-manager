package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.ClaimType;
import com.digitallegacy.entity.enums.EmergencyRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequestDto {

    private Long id;
    private Long assetId;
    private String assetName;
    private Long beneficiaryId;
    private String beneficiaryName;
    private String beneficiaryEmail;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private ClaimType claimType;
    private String reason;
    private Long evidenceFileId;
    private String evidenceFileName;
    private Long evidenceFileSize;
    private EmergencyRequestStatus status;
    private String adminNotes;
    private String verificationNotes;
    private String reviewedByAdminName;
    private LocalDateTime reviewedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
