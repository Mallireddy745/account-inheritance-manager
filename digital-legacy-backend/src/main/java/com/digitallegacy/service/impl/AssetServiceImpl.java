package com.digitallegacy.service.impl;

import com.digitallegacy.dto.request.AssetRequestDto;
import com.digitallegacy.dto.response.*;
import com.digitallegacy.entity.*;
import com.digitallegacy.entity.enums.AssetStatus;
import com.digitallegacy.exception.ResourceNotFoundException;
import com.digitallegacy.repository.*;
import com.digitallegacy.service.AssetService;
import com.digitallegacy.service.AuditService;
import com.digitallegacy.service.FileStorageService;
import com.digitallegacy.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetServiceImpl implements AssetService {

    private final DigitalAssetRepository assetRepository;
    private final AssetCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final AssetBeneficiaryRepository assetBeneficiaryRepository;
    private final AssetPermissionRepository assetPermissionRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;
    private final EncryptionUtil encryptionUtil;

    @Override
    @Transactional
    public AssetResponseDto createAsset(Long userId, AssetRequestDto request, List<MultipartFile> files) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        AssetCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));

        // Encrypt sensitive asset reference before database persistence
        String encryptedIdentifier = encryptionUtil.encryptString(request.getAssetIdentifier());

        DigitalAsset asset = DigitalAsset.builder()
                .user(user)
                .category(category)
                .name(request.getName().trim())
                .platformName(request.getPlatformName().trim())
                .assetIdentifier(encryptedIdentifier)
                .description(request.getDescription())
                .transferInstructions(request.getTransferInstructions())
                .status(request.getStatus() != null ? request.getStatus() : AssetStatus.ACTIVE)
                .build();

        DigitalAsset savedAsset = assetRepository.save(asset);

        // Assign Beneficiaries if provided
        if (request.getBeneficiaryIds() != null && !request.getBeneficiaryIds().isEmpty()) {
            BigDecimal allocation = request.getAllocationPercentage() != null
                    ? request.getAllocationPercentage()
                    : new BigDecimal("100.00");

            for (Long beneficiaryId : request.getBeneficiaryIds()) {
                Beneficiary beneficiary = beneficiaryRepository.findByIdAndOwnerId(beneficiaryId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found with ID: " + beneficiaryId));

                AssetBeneficiary link = AssetBeneficiary.builder()
                        .asset(savedAsset)
                        .beneficiary(beneficiary)
                        .allocationPercentage(allocation)
                        .build();

                assetBeneficiaryRepository.save(link);

                // Ensure initial access permissions exist for the assigned beneficiary
                if (assetPermissionRepository.findByAssetIdAndBeneficiaryIdAndPermissionType(
                        savedAsset.getId(), beneficiary.getId(), com.digitallegacy.entity.enums.PermissionType.VIEW).isEmpty()) {
                    AssetPermission viewPerm = AssetPermission.builder()
                            .asset(savedAsset)
                            .beneficiary(beneficiary)
                            .permissionType(com.digitallegacy.entity.enums.PermissionType.VIEW)
                            .accessCondition("Authorized for assigned estate asset")
                            .isRevoked(false)
                            .build();
                    assetPermissionRepository.save(viewPerm);
                }
                if (assetPermissionRepository.findByAssetIdAndBeneficiaryIdAndPermissionType(
                        savedAsset.getId(), beneficiary.getId(), com.digitallegacy.entity.enums.PermissionType.DOWNLOAD).isEmpty()) {
                    AssetPermission downloadPerm = AssetPermission.builder()
                            .asset(savedAsset)
                            .beneficiary(beneficiary)
                            .permissionType(com.digitallegacy.entity.enums.PermissionType.DOWNLOAD)
                            .accessCondition("Authorized for assigned document download")
                            .isRevoked(false)
                            .build();
                    assetPermissionRepository.save(downloadPerm);
                }
            }
        }

        // Store supporting files if provided
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    fileStorageService.storeFile(file, user, savedAsset);
                }
            }
        }

        auditService.logUserActivity(user, "ASSET_CREATED", "Created digital asset: " + savedAsset.getName(), null, null);

        return mapToDto(savedAsset);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AssetResponseDto> getUserAssets(Long userId, Long categoryId, String search, Pageable pageable) {
        Page<DigitalAsset> assets;

        if (search != null && !search.trim().isEmpty()) {
            assets = assetRepository.findByNameContainingIgnoreCaseAndUserId(search.trim(), userId, pageable);
        } else if (categoryId != null && categoryId > 0) {
            assets = assetRepository.findByUserIdAndCategoryId(userId, categoryId, pageable);
        } else {
            assets = assetRepository.findByUserId(userId, pageable);
        }

        return assets.map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public AssetResponseDto getAssetById(Long userId, Long assetId) {
        DigitalAsset asset = assetRepository.findByIdAndUserId(assetId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found or access denied for ID: " + assetId));

        return mapToDto(asset);
    }

    @Override
    @Transactional
    public AssetResponseDto updateAsset(Long userId, Long assetId, AssetRequestDto request) {
        DigitalAsset asset = assetRepository.findByIdAndUserId(assetId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found or access denied for ID: " + assetId));

        AssetCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));

        asset.setName(request.getName().trim());
        asset.setCategory(category);
        asset.setPlatformName(request.getPlatformName().trim());
        asset.setAssetIdentifier(encryptionUtil.encryptString(request.getAssetIdentifier()));
        asset.setDescription(request.getDescription());
        asset.setTransferInstructions(request.getTransferInstructions());
        if (request.getStatus() != null) {
            asset.setStatus(request.getStatus());
        }

        DigitalAsset updatedAsset = assetRepository.save(asset);

        // Update Beneficiaries and Permissions
        List<Long> targetBeneficiaryIds = request.getBeneficiaryIds();
        if (targetBeneficiaryIds != null) {
            // Remove existing mappings and re-link strictly for the selected beneficiaries
            assetBeneficiaryRepository.findByAssetId(assetId)
                    .forEach(assetBeneficiaryRepository::delete);

            // Also clean up any permissions for beneficiaries who are no longer assigned
            List<AssetPermission> existingPerms = assetPermissionRepository.findByAssetId(assetId);
            for (AssetPermission perm : existingPerms) {
                if (!targetBeneficiaryIds.contains(perm.getBeneficiary().getId())) {
                    assetPermissionRepository.delete(perm);
                }
            }

            BigDecimal allocation = request.getAllocationPercentage() != null
                    ? request.getAllocationPercentage()
                    : new BigDecimal("100.00");

            for (Long beneficiaryId : targetBeneficiaryIds) {
                Beneficiary beneficiary = beneficiaryRepository.findByIdAndOwnerId(beneficiaryId, userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found with ID: " + beneficiaryId));

                AssetBeneficiary link = AssetBeneficiary.builder()
                        .asset(updatedAsset)
                        .beneficiary(beneficiary)
                        .allocationPercentage(allocation)
                        .build();

                assetBeneficiaryRepository.save(link);

                // Ensure access permissions exist for this assigned beneficiary
                if (assetPermissionRepository.findByAssetIdAndBeneficiaryIdAndPermissionType(
                        updatedAsset.getId(), beneficiary.getId(), com.digitallegacy.entity.enums.PermissionType.VIEW).isEmpty()) {
                    AssetPermission viewPerm = AssetPermission.builder()
                            .asset(updatedAsset)
                            .beneficiary(beneficiary)
                            .permissionType(com.digitallegacy.entity.enums.PermissionType.VIEW)
                            .accessCondition("Authorized for assigned estate asset")
                            .isRevoked(false)
                            .build();
                    assetPermissionRepository.save(viewPerm);
                }
                if (assetPermissionRepository.findByAssetIdAndBeneficiaryIdAndPermissionType(
                        updatedAsset.getId(), beneficiary.getId(), com.digitallegacy.entity.enums.PermissionType.DOWNLOAD).isEmpty()) {
                    AssetPermission downloadPerm = AssetPermission.builder()
                            .asset(updatedAsset)
                            .beneficiary(beneficiary)
                            .permissionType(com.digitallegacy.entity.enums.PermissionType.DOWNLOAD)
                            .accessCondition("Authorized for assigned document download")
                            .isRevoked(false)
                            .build();
                    assetPermissionRepository.save(downloadPerm);
                }
            }
        }

        auditService.logUserActivity(asset.getUser(), "ASSET_UPDATED", "Updated digital asset: " + updatedAsset.getName(), null, null);

        return mapToDto(updatedAsset);
    }

    @Override
    @Transactional
    public void deleteAsset(Long userId, Long assetId) {
        DigitalAsset asset = assetRepository.findByIdAndUserId(assetId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found or access denied for ID: " + assetId));

        String assetName = asset.getName();
        assetRepository.delete(asset);

        auditService.logUserActivity(asset.getUser(), "ASSET_DELETED", "Deleted digital asset: " + assetName, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssetCategoryDto> getAllActiveCategories() {
        return categoryRepository.findByIsActiveTrue().stream()
                .map(cat -> AssetCategoryDto.builder()
                        .id(cat.getId())
                        .name(cat.getName())
                        .code(cat.getCode())
                        .description(cat.getDescription())
                        .icon(cat.getIcon())
                        .build())
                .collect(Collectors.toList());
    }

    private AssetResponseDto mapToDto(DigitalAsset asset) {
        String decryptedIdentifier = encryptionUtil.decryptString(asset.getAssetIdentifier());

        List<BeneficiarySummaryDto> beneficiaries = assetBeneficiaryRepository.findByAssetId(asset.getId()).stream()
                .map(ab -> BeneficiarySummaryDto.builder()
                        .id(ab.getBeneficiary().getId())
                        .fullName(ab.getBeneficiary().getFullName())
                        .email(ab.getBeneficiary().getEmail())
                        .relationship(ab.getBeneficiary().getRelationship())
                        .verificationStatus(ab.getBeneficiary().getVerificationStatus())
                        .allocationPercentage(ab.getAllocationPercentage())
                        .build())
                .collect(Collectors.toList());

        List<UploadedFileDto> files = asset.getFiles() != null
                ? asset.getFiles().stream()
                .map(f -> UploadedFileDto.builder()
                        .id(f.getId())
                        .fileName(f.getFileName())
                        .fileSize(f.getFileSize())
                        .contentType(f.getContentType())
                        .isEncrypted(f.getIsEncrypted())
                        .checksum(f.getChecksum())
                        .uploadedAt(f.getCreatedAt())
                        .build())
                .collect(Collectors.toList())
                : new ArrayList<>();

        return AssetResponseDto.builder()
                .id(asset.getId())
                .name(asset.getName())
                .categoryId(asset.getCategory().getId())
                .categoryName(asset.getCategory().getName())
                .categoryCode(asset.getCategory().getCode())
                .categoryIcon(asset.getCategory().getIcon())
                .platformName(asset.getPlatformName())
                .assetIdentifier(decryptedIdentifier)
                .description(asset.getDescription())
                .transferInstructions(asset.getTransferInstructions())
                .status(asset.getStatus())
                .createdAt(asset.getCreatedAt())
                .updatedAt(asset.getUpdatedAt())
                .beneficiaries(beneficiaries)
                .files(files)
                .build();
    }

    @Override
    @Transactional
    public UploadedFileDto uploadFileToAsset(Long userId, Long assetId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        DigitalAsset asset = assetRepository.findByIdAndUserId(assetId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with ID: " + assetId));

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        UploadedFile uploaded = fileStorageService.storeFile(file, user, asset);
        auditService.logUserActivity(user, "FILE_UPLOADED",
                "Uploaded encrypted document '" + uploaded.getFileName() + "' to asset: " + asset.getName(), null, null);

        return UploadedFileDto.builder()
                .id(uploaded.getId())
                .fileName(uploaded.getFileName())
                .fileSize(uploaded.getFileSize())
                .contentType(uploaded.getContentType())
                .isEncrypted(uploaded.getIsEncrypted())
                .checksum(uploaded.getChecksum())
                .uploadedAt(uploaded.getCreatedAt())
                .build();
    }
}
