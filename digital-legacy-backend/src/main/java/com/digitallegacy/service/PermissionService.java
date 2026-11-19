package com.digitallegacy.service;

import com.digitallegacy.dto.request.PermissionRequestDto;
import com.digitallegacy.dto.response.PermissionResponseDto;

import java.util.List;

public interface PermissionService {

    PermissionResponseDto grantPermission(Long userId, PermissionRequestDto request);

    List<PermissionResponseDto> getUserPermissions(Long userId);

    PermissionResponseDto revokePermission(Long userId, Long permissionId);

    void deletePermission(Long userId, Long permissionId);
}
