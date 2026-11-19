package com.digitallegacy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryPortalSummaryDto {

    private int totalInheritedAssets;
    private int totalGrantors;
    private int activePermissionsCount;
    private int pendingClaimsCount;
    private int approvedClaimsCount;
    private String verificationStatus;
    private String beneficiaryFullName;
    private String beneficiaryEmail;
}
