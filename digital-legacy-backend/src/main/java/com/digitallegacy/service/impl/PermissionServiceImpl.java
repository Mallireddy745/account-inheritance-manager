package com.digitallegacy.service.impl;

import com.digitallegacy.dto.request.PermissionRequestDto;
import com.digitallegacy.dto.response.PermissionResponseDto;
import com.digitallegacy.entity.AssetBeneficiary;
import com.digitallegacy.entity.AssetPermission;
import com.digitallegacy.entity.Beneficiary;
import com.digitallegacy.entity.DigitalAsset;
import com.digitallegacy.exception.ResourceNotFoundException;
import com.digitallegacy.repository.AssetBeneficiaryRepository;
import com.digitallegacy.repository.AssetPermissionRepository;
import com.digitallegacy.repository.BeneficiaryRepository;
import com.digitallegacy.repository.DigitalAssetRepository;
import com.digitallegacy.service.AuditService;
import com.digitallegacy.service.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private final AssetPermissionRepository permissionRepository;
    private final DigitalAssetRepository assetRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final AssetBeneficiaryRepository assetBeneficiaryRepository;
    private final AuditService auditService;

    @Override
    @Transactional
    public PermissionResponseDto grantPermission(Long userId, PermissionRequestDto request) {
        DigitalAsset asset = assetRepository.findByIdAndUserId(request.getAssetId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found or access denied for ID: " + request.getAssetId()));

        Beneficiary beneficiary = beneficiaryRepository.findByIdAndOwnerId(request.getBeneficiaryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found or access denied for ID: " + request.getBeneficiaryId()));

        // Check if matching permission already exists
        AssetPermission permission = permissionRepository.findByAssetIdAndBeneficiaryIdAndPermissionType(
                asset.getId(), beneficiary.getId(), request.getPermissionType()
        ).orElse(null);

        if (permission != null) {
            permission.setIsRevoked(false);
            permission.setEffectiveFrom(request.getEffectiveFrom());
            permission.setExpiresAt(request.getExpiresAt());
            permission.setAccessCondition(request.getAccessCondition());
        } else {
            permission = AssetPermission.builder()
                    .asset(asset)
                    .beneficiary(beneficiary)
                    .permissionType(request.getPermissionType())
                    .isRevoked(false)
                    .effectiveFrom(request.getEffectiveFrom())
                    .expiresAt(request.getExpiresAt())
                    .accessCondition(request.getAccessCondition())
                    .build();
        }

        AssetPermission saved = permissionRepository.save(permission);

        // Ensure AssetBeneficiary association exists when permission is granted
        if (assetBeneficiaryRepository.findByAssetIdAndBeneficiaryId(asset.getId(), beneficiary.getId()).isEmpty()) {
            AssetBeneficiary link = AssetBeneficiary.builder()
                    .asset(asset)
                    .beneficiary(beneficiary)
                    .allocationPercentage(new java.math.BigDecimal("100.00"))
                    .notes("Linked via direct permission grant")
                    .build();
            assetBeneficiaryRepository.save(link);
        }

        auditService.logUserActivity(asset.getUser(), "PERMISSION_GRANTED",
                "Granted " + saved.getPermissionType() + " on " + asset.getName() + " to " + beneficiary.getFullName(), null, null);

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionResponseDto> getUserPermissions(Long userId) {
        return permissionRepository.findByAssetOwnerId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PermissionResponseDto revokePermission(Long userId, Long permissionId) {
        AssetPermission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with ID: " + permissionId));

        if (!permission.getAsset().getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You do not have authorization to modify this permission");
        }

        permission.setIsRevoked(true);
        AssetPermission saved = permissionRepository.save(permission);

        auditService.logUserActivity(permission.getAsset().getUser(), "PERMISSION_REVOKED",
                "Revoked " + saved.getPermissionType() + " on " + permission.getAsset().getName(), null, null);

        return mapToDto(saved);
    }

    @Override
    @Transactional
    public void deletePermission(Long userId, Long permissionId) {
        AssetPermission permission = permissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with ID: " + permissionId));

        if (!permission.getAsset().getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You do not have authorization to delete this permission");
        }

        permissionRepository.delete(permission);
    }

    private PermissionResponseDto mapToDto(AssetPermission p) {
        return PermissionResponseDto.builder()
                .id(p.getId())
                .assetId(p.getAsset().getId())
                .assetName(p.getAsset().getName())
                .beneficiaryId(p.getBeneficiary().getId())
                .beneficiaryName(p.getBeneficiary().getFullName())
                .beneficiaryEmail(p.getBeneficiary().getEmail())
                .permissionType(p.getPermissionType())
                .isRevoked(p.getIsRevoked())
                .effectiveFrom(p.getEffectiveFrom())
                .expiresAt(p.getExpiresAt())
                .accessCondition(p.getAccessCondition())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
