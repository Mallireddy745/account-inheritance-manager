package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.AssetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InheritedAssetDto {

    private Long id;
    private String name;
    private String categoryName;
    private String categoryIcon;
    private String platformName;

    // Grantor / Owner Details
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;

    private BigDecimal allocationPercentage;
    private AssetStatus status;
    private String transferInstructions;

    // Zero-Trust Conditional Access
    private boolean canViewSecret;
    private String assetIdentifier; // Masked unless permission or claim granted

    @Builder.Default
    private List<String> permissions = new ArrayList<>();

    @Builder.Default
    private List<String> accessConditions = new ArrayList<>();

    @Builder.Default
    private List<UploadedFileDto> files = new ArrayList<>();

    private boolean hasPendingClaim;
    private String claimStatus;
    private Long beneficiaryRecordId;
}
