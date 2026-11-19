package com.digitallegacy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingDto {

    private Long id;
    private String settingKey;
    private String settingValue;
    private String description;
}
