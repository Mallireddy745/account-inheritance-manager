package com.digitallegacy.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum Role {
    OWNER,
    BENEFICIARY,
    VERIFIER,
    ADMIN;

    @JsonCreator
    public static Role fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return OWNER;
        }
        String upper = value.trim().toUpperCase();
        if ("USER".equals(upper)) {
            return OWNER;
        }
        for (Role r : Role.values()) {
            if (r.name().equalsIgnoreCase(upper)) {
                return r;
            }
        }
        return OWNER;
    }
}
