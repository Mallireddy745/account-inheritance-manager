package com.digitallegacy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationRecordDto {

    private Long id;
    private Long beneficiaryId;
    private String beneficiaryName;
    private String beneficiaryEmail;
    private Long ownerUserId;
    private String ownerEmail;
    private String verificationType;
    private Long documentFileId;
    private String documentFileName;
    private Long documentFileSize;
    private String status;
    private String rejectionReason;
    private Long verifierAdminId;
    private String verifierAdminEmail;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
