package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BeneficiarySummaryDto {

    private Long id;
    private String fullName;
    private String email;
    private String relationship;
    private VerificationStatus verificationStatus;
    private BigDecimal allocationPercentage;
}
