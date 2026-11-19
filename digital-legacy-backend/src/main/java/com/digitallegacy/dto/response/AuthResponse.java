package com.digitallegacy.dto.response;

import com.digitallegacy.entity.enums.Role;
import com.digitallegacy.entity.enums.UserStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long userId;
    private String email;
    private String fullName;
    private Role role;
    private UserStatus status;
    private Long expiresInMs;
    @JsonProperty("isBeneficiary")
    private boolean isBeneficiary;
    private int inheritedAssetsCount;

    @JsonProperty("beneficiary")
    public boolean getBeneficiary() {
        return isBeneficiary;
    }
}
