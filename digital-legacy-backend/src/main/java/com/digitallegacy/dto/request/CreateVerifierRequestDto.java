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
public class CreateVerifierRequestDto {

    @NotBlank(message = "Verifier full name is required")
    @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
    private String fullName;

    @NotBlank(message = "Verifier email address is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Initial password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
    private String password;

    private String phoneNumber;

    private String notes;
}
