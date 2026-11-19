package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.AssetStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetResponseDto {

    private Long id;
    private String name;
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private String categoryIcon;
    private String platformName;
    private String assetIdentifier;
    private String description;
    private String transferInstructions;
    private AssetStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<BeneficiarySummaryDto> beneficiaries = new ArrayList<>();

    @Builder.Default
    private List<UploadedFileDto> files = new ArrayList<>();
}
