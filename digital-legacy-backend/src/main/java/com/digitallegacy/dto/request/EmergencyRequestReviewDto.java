package com.digitallegacy.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyRequestReviewDto {

    @Size(max = 2000, message = "Admin notes must be at most 2000 characters")
    private String adminNotes;

    @Size(max = 2000, message = "Rejection reason must be at most 2000 characters")
    private String rejectionReason;

    @Size(max = 2000, message = "Verification notes must be at most 2000 characters")
    private String verificationNotes;

    private String status;
}
