package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.InvitationStatus;
import com.digitallegacy.entity.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryResponseDto {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String relationship;
    private String address;
    private VerificationStatus verificationStatus;
    private InvitationStatus invitationStatus;
    private String invitationToken;
    private boolean isRegistered;
    private int assignedAssetsCount;
    private List<Long> assignedAssetIds;
    private List<String> assignedAssetNames;
    private List<String> permissionTypes;
    private LocalDateTime createdAt;
}
