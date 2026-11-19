package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.AssetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAssetDto {

    private Long id;
    private String assetName;
    private String categoryName;
    private String platformName;
    private AssetStatus status;
    private Long ownerId;
    private String ownerEmail;
    private String ownerName;
    private int beneficiaryCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
