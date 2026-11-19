package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerProfileSummaryDto {
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private String relationship;
    private InvitationStatus invitationStatus;
    private int assignedAssetsCount;
    private boolean hasApprovedClaim;
    private boolean hasPendingClaim;
    private Long beneficiaryRecordId;
}
