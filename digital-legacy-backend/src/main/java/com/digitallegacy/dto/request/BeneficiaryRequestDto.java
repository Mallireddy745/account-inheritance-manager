package com.digitallegacy.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiaryRequestDto {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email format is required")
    private String email;

    private String phoneNumber;

    @NotBlank(message = "Relationship is required")
    @Size(min = 2, max = 100, message = "Relationship must be between 2 and 100 characters")
    private String relationship;

    private String address;

    private java.util.List<Long> assignedAssetIds;

    private String permissionType;

    private java.math.BigDecimal allocationPercentage;
}
