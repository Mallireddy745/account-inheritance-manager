package com.digitallegacy.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadedFileDto {

    private Long id;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private Boolean isEncrypted;
    private String checksum;
    private LocalDateTime uploadedAt;
}
