package com.digitallegacy.dto.request;

import com.digitallegacy.entity.enums.Role;
import jakarta.validation.constraints.AssertTrue;
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
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150, message = "Full name must be between 2 and 150 characters")
    private String fullName;

    @NotBlank(message = "Email address is required")
    @Email(message = "Email address must be a valid email format")
    private String email;

    private String phoneNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters long")
    private String password;

    private String confirmPassword;

    private Boolean termsConsent;

    private Boolean agreedToTerms;

    private Role role;

    public String getConfirmPassword() {
        return confirmPassword != null && !confirmPassword.isBlank() ? confirmPassword : password;
    }

    @AssertTrue(message = "You must agree to the Terms of Service and Privacy Policy")
    public boolean isConsentAgreed() {
        if (termsConsent != null && termsConsent) return true;
        if (agreedToTerms != null && agreedToTerms) return true;
        return false;
    }
}
