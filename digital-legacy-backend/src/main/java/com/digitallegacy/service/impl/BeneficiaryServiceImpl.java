package com.digitallegacy.service.impl;

import com.digitallegacy.dto.request.BeneficiaryRequestDto;
import com.digitallegacy.dto.response.BeneficiaryResponseDto;
import com.digitallegacy.dto.response.EmergencyRequestDto;
import com.digitallegacy.entity.AssetBeneficiary;
import com.digitallegacy.entity.AssetPermission;
import com.digitallegacy.entity.Beneficiary;
import com.digitallegacy.entity.DigitalAsset;
import com.digitallegacy.entity.EmergencyRequest;
import com.digitallegacy.entity.User;
import com.digitallegacy.entity.enums.InvitationStatus;
import com.digitallegacy.entity.enums.NotificationType;
import com.digitallegacy.entity.enums.PermissionType;
import com.digitallegacy.entity.enums.VerificationStatus;
import com.digitallegacy.exception.DuplicateResourceException;
import com.digitallegacy.exception.ResourceNotFoundException;
import com.digitallegacy.repository.AssetBeneficiaryRepository;
import com.digitallegacy.repository.AssetPermissionRepository;
import com.digitallegacy.repository.BeneficiaryRepository;
import com.digitallegacy.repository.DigitalAssetRepository;
import com.digitallegacy.repository.EmergencyRequestRepository;
import com.digitallegacy.repository.UserRepository;
import com.digitallegacy.service.AuditService;
import com.digitallegacy.service.BeneficiaryService;
import com.digitallegacy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BeneficiaryServiceImpl implements BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final UserRepository userRepository;
    private final AssetBeneficiaryRepository assetBeneficiaryRepository;
    private final AssetPermissionRepository assetPermissionRepository;
    private final DigitalAssetRepository digitalAssetRepository;
    private final EmergencyRequestRepository emergencyRequestRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Override
    @Transactional
    public BeneficiaryResponseDto createBeneficiary(Long userId, BeneficiaryRequestDto request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Owner not found with ID: " + userId));

        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (beneficiaryRepository.existsByOwnerIdAndEmail(userId, cleanEmail)) {
            throw new DuplicateResourceException("You have already added a beneficiary with email: " + cleanEmail);
        }

        // Check if beneficiary is already registered in the platform as a user
        User registeredBeneficiaryUser = userRepository.findByEmail(cleanEmail).orElse(null);

        Beneficiary beneficiary = Beneficiary.builder()
                .owner(owner)
                .fullName(request.getFullName().trim())
                .email(cleanEmail)
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .relationship(request.getRelationship().trim())
                .address(request.getAddress())
                .verificationStatus(VerificationStatus.UNVERIFIED)
                .invitationStatus(InvitationStatus.PENDING)
                .invitationToken(UUID.randomUUID().toString())
                .beneficiaryUser(registeredBeneficiaryUser)
                .build();

        Beneficiary savedBeneficiary = beneficiaryRepository.save(beneficiary);

        // Assign digital assets and permissions if provided
        assignAssetsAndPermissions(owner, savedBeneficiary, request.getAssignedAssetIds(),
                request.getPermissionType(), request.getAllocationPercentage());

        // Send notification to registered beneficiary if their account exists
        if (registeredBeneficiaryUser != null) {
            String ownerName = owner.getProfile() != null ? owner.getProfile().getFullName() : owner.getEmail();
            notificationService.sendNotification(
                    registeredBeneficiaryUser.getId(),
                    "New Estate Beneficiary Nomination",
                    ownerName + " has nominated you as a beneficiary for their digital estate.",
                    NotificationType.BENEFICIARY
            );
        }

        auditService.logUserActivity(owner, "BENEFICIARY_ADDED", "Added beneficiary: " + savedBeneficiary.getFullName(), null, null);

        return mapToDto(savedBeneficiary);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BeneficiaryResponseDto> getUserBeneficiaries(Long userId, Pageable pageable) {
        return beneficiaryRepository.findByOwnerId(userId, pageable)
                .map(this::mapToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public BeneficiaryResponseDto getBeneficiaryById(Long userId, Long beneficiaryId) {
        Beneficiary beneficiary = beneficiaryRepository.findByIdAndOwnerId(beneficiaryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found or access denied for ID: " + beneficiaryId));

        return mapToDto(beneficiary);
    }

    @Override
    @Transactional
    public BeneficiaryResponseDto updateBeneficiary(Long userId, Long beneficiaryId, BeneficiaryRequestDto request) {
        Beneficiary beneficiary = beneficiaryRepository.findByIdAndOwnerId(beneficiaryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found or access denied for ID: " + beneficiaryId));

        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (!beneficiary.getEmail().equalsIgnoreCase(cleanEmail) &&
                beneficiaryRepository.existsByOwnerIdAndEmail(userId, cleanEmail)) {
            throw new DuplicateResourceException("Another beneficiary already exists with email: " + cleanEmail);
        }

        beneficiary.setFullName(request.getFullName().trim());
        beneficiary.setEmail(cleanEmail);
        beneficiary.setPhoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null);
        beneficiary.setRelationship(request.getRelationship().trim());
        beneficiary.setAddress(request.getAddress());

        // Check if user registered in meantime
        if (beneficiary.getBeneficiaryUser() == null) {
            userRepository.findByEmail(cleanEmail).ifPresent(beneficiary::setBeneficiaryUser);
        }

        Beneficiary updated = beneficiaryRepository.save(beneficiary);

        // Update assigned assets & permissions if provided
        if (request.getAssignedAssetIds() != null) {
            assignAssetsAndPermissions(beneficiary.getOwner(), updated, request.getAssignedAssetIds(),
                    request.getPermissionType(), request.getAllocationPercentage());
        }

        auditService.logUserActivity(beneficiary.getOwner(), "BENEFICIARY_UPDATED", "Updated beneficiary: " + updated.getFullName(), null, null);

        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteBeneficiary(Long userId, Long beneficiaryId) {
        Beneficiary beneficiary = beneficiaryRepository.findByIdAndOwnerId(beneficiaryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found or access denied for ID: " + beneficiaryId));

        String name = beneficiary.getFullName();
        beneficiaryRepository.delete(beneficiary);

        auditService.logUserActivity(beneficiary.getOwner(), "BENEFICIARY_DELETED", "Deleted beneficiary: " + name, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmergencyRequestDto> getRequestsForBeneficiary(Long userId, Long beneficiaryId, Pageable pageable) {
        Beneficiary beneficiary = beneficiaryRepository.findByIdAndOwnerId(beneficiaryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found or access denied for ID: " + beneficiaryId));

        return emergencyRequestRepository.findByBeneficiaryId(beneficiary.getId(), pageable).map(this::toRequestDto);
    }

    @Override
    @Transactional
    public BeneficiaryResponseDto resendInvitation(Long userId, Long beneficiaryId) {
        Beneficiary beneficiary = beneficiaryRepository.findByIdAndOwnerId(beneficiaryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found or access denied for ID: " + beneficiaryId));

        beneficiary.setInvitationToken(UUID.randomUUID().toString());
        beneficiary.setInvitationStatus(InvitationStatus.PENDING);
        Beneficiary saved = beneficiaryRepository.save(beneficiary);

        if (saved.getBeneficiaryUser() != null) {
            notificationService.sendNotification(
                    saved.getBeneficiaryUser().getId(),
                    "Estate Invitation Reminder",
                    "You have a pending nomination from " + saved.getOwner().getEmail() + ". Please review and accept your invitation.",
                    NotificationType.BENEFICIARY
            );
        }

        auditService.logUserActivity(saved.getOwner(), "INVITATION_RESENT", "Resent invitation to " + saved.getEmail(), null, null);

        return mapToDto(saved);
    }

    private void assignAssetsAndPermissions(User owner, Beneficiary beneficiary, List<Long> assetIds,
                                            String permissionTypeStr, BigDecimal allocation) {
        // 1. Deduplicate target asset IDs and remove any nulls
        java.util.Set<Long> targetIds = assetIds != null
                ? assetIds.stream().filter(java.util.Objects::nonNull).collect(java.util.stream.Collectors.toSet())
                : java.util.Collections.emptySet();

        // 2. Fetch existing links for this beneficiary
        List<AssetBeneficiary> existingLinks = assetBeneficiaryRepository.findByBeneficiaryId(beneficiary.getId());
        java.util.Set<Long> currentlyLinkedAssetIds = new java.util.HashSet<>();

        for (AssetBeneficiary link : existingLinks) {
            Long linkedAssetId = link.getAsset() != null ? link.getAsset().getId() : null;
            if (linkedAssetId == null || !targetIds.contains(linkedAssetId)) {
                assetBeneficiaryRepository.delete(link);
            } else {
                currentlyLinkedAssetIds.add(linkedAssetId);
                if (allocation != null) {
                    link.setAllocationPercentage(allocation);
                    assetBeneficiaryRepository.save(link);
                }
            }
        }
        assetBeneficiaryRepository.flush();

        // 3. Remove AssetPermission records for assets that are no longer assigned
        List<AssetPermission> existingPerms = assetPermissionRepository.findByBeneficiaryId(beneficiary.getId());
        for (AssetPermission perm : existingPerms) {
            if (perm.getAsset() == null || !targetIds.contains(perm.getAsset().getId())) {
                assetPermissionRepository.delete(perm);
            }
        }
        assetPermissionRepository.flush();

        if (targetIds.isEmpty()) {
            return;
        }

        PermissionType permissionType = PermissionType.VIEW;
        if (permissionTypeStr != null && !permissionTypeStr.isBlank()) {
            try {
                permissionType = PermissionType.valueOf(permissionTypeStr.toUpperCase());
            } catch (Exception ignored) {}
        }

        BigDecimal allocPercent = allocation != null ? allocation : BigDecimal.valueOf(100.0);

        // 4. Only insert links for assets that are not already linked
        for (Long assetId : targetIds) {
            DigitalAsset asset = digitalAssetRepository.findByIdAndUserId(assetId, owner.getId()).orElse(null);
            if (asset == null) continue;

            if (!currentlyLinkedAssetIds.contains(asset.getId())) {
                if (assetBeneficiaryRepository.findByAssetIdAndBeneficiaryId(asset.getId(), beneficiary.getId()).isEmpty()) {
                    AssetBeneficiary ab = AssetBeneficiary.builder()
                            .asset(asset)
                            .beneficiary(beneficiary)
                            .allocationPercentage(allocPercent)
                            .notes("Assigned by owner upon beneficiary setup")
                            .build();
                    assetBeneficiaryRepository.saveAndFlush(ab);
                    currentlyLinkedAssetIds.add(asset.getId());
                }
            }

            // Create AssetPermission (VIEW) if not present
            if (assetPermissionRepository.findByAssetIdAndBeneficiaryIdAndPermissionType(asset.getId(), beneficiary.getId(), permissionType).isEmpty()) {
                AssetPermission ap = AssetPermission.builder()
                        .asset(asset)
                        .beneficiary(beneficiary)
                        .permissionType(permissionType)
                        .accessCondition("Upon approved inheritance claim or verified identity")
                        .isRevoked(false)
                        .build();
                assetPermissionRepository.saveAndFlush(ap);
            }

            // Also ensure DOWNLOAD permission exists if permissionType is DOWNLOAD or TRANSFER
            if ((permissionType == PermissionType.DOWNLOAD || permissionType == PermissionType.TRANSFER) &&
                    assetPermissionRepository.findByAssetIdAndBeneficiaryIdAndPermissionType(asset.getId(), beneficiary.getId(), PermissionType.DOWNLOAD).isEmpty()) {
                AssetPermission apDown = AssetPermission.builder()
                        .asset(asset)
                        .beneficiary(beneficiary)
                        .permissionType(PermissionType.DOWNLOAD)
                        .accessCondition("Upon approved inheritance claim or verified identity")
                        .isRevoked(false)
                        .build();
                assetPermissionRepository.saveAndFlush(apDown);
            }
        }
    }

    private BeneficiaryResponseDto mapToDto(Beneficiary beneficiary) {
        List<AssetBeneficiary> abs = assetBeneficiaryRepository.findByBeneficiaryId(beneficiary.getId());
        List<Long> assetIds = abs.stream().map(a -> a.getAsset().getId()).toList();
        List<String> assetNames = abs.stream().map(a -> a.getAsset().getName()).toList();

        List<AssetPermission> perms = assetPermissionRepository.findByBeneficiaryId(beneficiary.getId());
        List<String> permTypes = perms.stream().map(p -> p.getPermissionType().name()).distinct().toList();

        return BeneficiaryResponseDto.builder()
                .id(beneficiary.getId())
                .fullName(beneficiary.getFullName())
                .email(beneficiary.getEmail())
                .phoneNumber(beneficiary.getPhoneNumber())
                .relationship(beneficiary.getRelationship())
                .address(beneficiary.getAddress())
                .verificationStatus(beneficiary.getVerificationStatus())
                .invitationStatus(beneficiary.getInvitationStatus())
                .invitationToken(beneficiary.getInvitationToken())
                .isRegistered(beneficiary.getBeneficiaryUser() != null)
                .assignedAssetsCount(abs.size())
                .assignedAssetIds(assetIds)
                .assignedAssetNames(assetNames)
                .permissionTypes(permTypes)
                .createdAt(beneficiary.getCreatedAt())
                .build();
    }

    private EmergencyRequestDto toRequestDto(EmergencyRequest r) {
        String ownerName = r.getOwner().getProfile() != null ? r.getOwner().getProfile().getFullName() : r.getOwner().getEmail();
        String assetName = r.getAsset() != null ? r.getAsset().getName() : "All Designated Estate Assets";
        Long assetId = r.getAsset() != null ? r.getAsset().getId() : null;

        return EmergencyRequestDto.builder()
                .id(r.getId())
                .assetId(assetId)
                .assetName(assetName)
                .beneficiaryId(r.getBeneficiary().getId())
                .beneficiaryName(r.getBeneficiary().getFullName())
                .beneficiaryEmail(r.getBeneficiary().getEmail())
                .ownerId(r.getOwner().getId())
                .ownerName(ownerName)
                .ownerEmail(r.getOwner().getEmail())
                .claimType(r.getClaimType())
                .reason(r.getReason())
                .status(r.getStatus())
                .adminNotes(r.getAdminNotes())
                .verificationNotes(r.getVerificationNotes())
                .evidenceFileId(r.getEvidenceFile() != null ? r.getEvidenceFile().getId() : null)
                .evidenceFileName(r.getEvidenceFile() != null ? r.getEvidenceFile().getFileName() : null)
                .evidenceFileSize(r.getEvidenceFile() != null ? r.getEvidenceFile().getFileSize() : null)
                .reviewedAt(r.getReviewedAt())
                .completedAt(r.getCompletedAt())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
