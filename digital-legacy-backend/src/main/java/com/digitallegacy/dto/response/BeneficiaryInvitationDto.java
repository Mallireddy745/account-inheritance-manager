package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryInvitationDto {
    private Long id;
    private Long beneficiaryId;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String relationship;
    private InvitationStatus invitationStatus;
    private int assignedAssetsCount;
    private LocalDateTime createdAt;

    public Long getBeneficiaryId() {
        return beneficiaryId != null ? beneficiaryId : id;
    }
}
