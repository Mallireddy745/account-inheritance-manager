package com.digitallegacy.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
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
public class ChangePasswordRequestDto {

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "New password must be at least 8 characters long")
    private String newPassword;

    @JsonAlias({"confirmPassword", "confirm_new_password", "confirm_password"})
    private String confirmNewPassword;

    public String getConfirmNewPassword() {
        return (confirmNewPassword != null && !confirmNewPassword.isBlank())
                ? confirmNewPassword
                : newPassword;
    }
}
