package com.digitallegacy.dto.request;

import com.digitallegacy.entity.enums.AssetStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetRequestDto {

    @NotBlank(message = "Asset name is required")
    @Size(min = 2, max = 200, message = "Asset name must be between 2 and 200 characters")
    private String name;

    @NotNull(message = "Asset category is required")
    @jakarta.validation.constraints.Positive(message = "Asset category must be selected")
    private Long categoryId;

    @NotBlank(message = "Platform or service name is required")
    @Size(min = 2, max = 150, message = "Platform name must be between 2 and 150 characters")
    private String platformName;

    @NotBlank(message = "Asset reference / identifier is required")
    @Size(min = 2, max = 255, message = "Identifier must be between 2 and 255 characters")
    private String assetIdentifier;

    private String description;

    private String transferInstructions;

    @Builder.Default
    private AssetStatus status = AssetStatus.ACTIVE;

    private List<Long> beneficiaryIds;

    private Long beneficiaryId;

    public List<Long> getBeneficiaryIds() {
        if (beneficiaryIds != null && !beneficiaryIds.isEmpty()) {
            return beneficiaryIds;
        }
        if (beneficiaryId != null && beneficiaryId > 0) {
            return java.util.Collections.singletonList(beneficiaryId);
        }
        return java.util.Collections.emptyList();
    }

    @Builder.Default
    private BigDecimal allocationPercentage = new BigDecimal("100.00");
}
