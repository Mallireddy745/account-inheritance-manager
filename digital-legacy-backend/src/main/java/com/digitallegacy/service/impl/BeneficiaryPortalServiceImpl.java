package com.digitallegacy.service.impl;

import com.digitallegacy.dto.response.*;
import com.digitallegacy.entity.*;
import com.digitallegacy.entity.enums.EmergencyRequestStatus;
import com.digitallegacy.entity.enums.InvitationStatus;
import com.digitallegacy.entity.enums.PermissionType;
import com.digitallegacy.exception.ResourceNotFoundException;
import com.digitallegacy.repository.*;
import com.digitallegacy.service.AuditService;
import com.digitallegacy.service.BeneficiaryPortalService;
import com.digitallegacy.service.FileStorageService;
import com.digitallegacy.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BeneficiaryPortalServiceImpl implements BeneficiaryPortalService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final AssetBeneficiaryRepository assetBeneficiaryRepository;
    private final AssetPermissionRepository assetPermissionRepository;
    private final EmergencyRequestRepository emergencyRequestRepository;
    private final DigitalAssetRepository digitalAssetRepository;
    private final UploadedFileRepository uploadedFileRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final EncryptionUtil encryptionUtil;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public BeneficiaryPortalSummaryDto getPortalSummary(Long userId, String email) {
        List<Beneficiary> records = beneficiaryRepository.findByUserIdOrEmail(userId, email);
        if (records.isEmpty()) {
            return BeneficiaryPortalSummaryDto.builder()
                    .totalInheritedAssets(0)
                    .totalGrantors(0)
                    .activePermissionsCount(0)
                    .pendingClaimsCount(0)
                    .approvedClaimsCount(0)
                    .verificationStatus("UNVERIFIED")
                    .beneficiaryEmail(email)
                    .build();
        }

        List<Long> bIds = records.stream().map(Beneficiary::getId).toList();
        List<AssetBeneficiary> links = assetBeneficiaryRepository.findByBeneficiaryIdIn(bIds);
        Set<Long> uniqueGrantorIds = records.stream().map(b -> b.getOwner().getId()).collect(Collectors.toSet());
        List<AssetPermission> activePerms = assetPermissionRepository.findByBeneficiaryIdInAndIsRevokedFalse(bIds);
        List<EmergencyRequest> claims = emergencyRequestRepository.findByBeneficiaryIdIn(bIds);

        long pendingClaims = claims.stream().filter(c -> c.getStatus() == EmergencyRequestStatus.PENDING ||
                c.getStatus() == EmergencyRequestStatus.UNDER_REVIEW ||
                c.getStatus() == EmergencyRequestStatus.ADDITIONAL_INFORMATION_REQUIRED).count();
        long approvedClaims = claims.stream().filter(c -> c.getStatus() == EmergencyRequestStatus.APPROVED ||
                c.getStatus() == EmergencyRequestStatus.COMPLETED).count();

        String verStatus = records.stream()
                .map(b -> b.getVerificationStatus().name())
                .filter(s -> s.equals("VERIFIED"))
                .findFirst()
                .orElse(records.get(0).getVerificationStatus().name());

        return BeneficiaryPortalSummaryDto.builder()
                .totalInheritedAssets(links.size())
                .totalGrantors(uniqueGrantorIds.size())
                .activePermissionsCount(activePerms.size())
                .pendingClaimsCount((int) pendingClaims)
                .approvedClaimsCount((int) approvedClaims)
                .verificationStatus(verStatus)
                .beneficiaryFullName(records.get(0).getFullName())
                .beneficiaryEmail(email)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BeneficiaryInvitationDto> getMyInvitations(Long userId, String email) {
        List<Beneficiary> records = beneficiaryRepository.findByUserIdOrEmail(userId, email);
        List<BeneficiaryInvitationDto> invitations = new ArrayList<>();

        for (Beneficiary b : records) {
            String ownerName = b.getOwner().getProfile() != null ? b.getOwner().getProfile().getFullName() : b.getOwner().getEmail();
            int assetCount = assetBeneficiaryRepository.findByBeneficiaryId(b.getId()).size();

            invitations.add(BeneficiaryInvitationDto.builder()
                    .id(b.getId())
                    .beneficiaryId(b.getId())
                    .ownerId(b.getOwner().getId())
                    .ownerName(ownerName)
                    .ownerEmail(b.getOwner().getEmail())
                    .relationship(b.getRelationship())
                    .invitationStatus(b.getInvitationStatus())
                    .assignedAssetsCount(assetCount)
                    .createdAt(b.getCreatedAt())
                    .build());
        }

        return invitations;
    }

    @Override
    @Transactional
    public void acceptInvitation(Long beneficiaryId, Long userId, String email) {
        Beneficiary b = beneficiaryRepository.findById(beneficiaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary invitation not found with ID: " + beneficiaryId));

        if (!b.getEmail().equalsIgnoreCase(email) && (b.getBeneficiaryUser() == null || !b.getBeneficiaryUser().getId().equals(userId))) {
            throw new AccessDeniedException("You are not authorized to accept this invitation.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        b.setBeneficiaryUser(user);
        b.setInvitationStatus(InvitationStatus.ACCEPTED);
        beneficiaryRepository.save(b);

        auditService.logUserActivity(user, "INVITATION_ACCEPTED",
                "Accepted inheritance nomination from " + b.getOwner().getEmail(), null, null);
    }

    @Override
    @Transactional
    public void declineInvitation(Long beneficiaryId, Long userId, String email) {
        Beneficiary b = beneficiaryRepository.findById(beneficiaryId)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary invitation not found with ID: " + beneficiaryId));

        if (!b.getEmail().equalsIgnoreCase(email) && (b.getBeneficiaryUser() == null || !b.getBeneficiaryUser().getId().equals(userId))) {
            throw new AccessDeniedException("You are not authorized to decline this invitation.");
        }

        User user = userRepository.findById(userId).orElse(null);

        b.setInvitationStatus(InvitationStatus.DECLINED);
        beneficiaryRepository.save(b);

        if (user != null) {
            auditService.logUserActivity(user, "INVITATION_DECLINED",
                    "Declined inheritance nomination from " + b.getOwner().getEmail(), null, null);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<OwnerProfileSummaryDto> getMyOwners(Long userId, String email) {
        List<Beneficiary> records = beneficiaryRepository.findByUserIdOrEmail(userId, email);
        List<OwnerProfileSummaryDto> owners = new ArrayList<>();

        for (Beneficiary b : records) {
            User owner = b.getOwner();
            String ownerName = owner.getProfile() != null ? owner.getProfile().getFullName() : owner.getEmail();
            String ownerPhone = owner.getProfile() != null ? owner.getProfile().getPhoneNumber() : null;
            int assetCount = assetBeneficiaryRepository.findByBeneficiaryId(b.getId()).size();

            List<EmergencyRequest> claims = emergencyRequestRepository.findByBeneficiaryId(b.getId());
            boolean hasApproved = claims.stream().anyMatch(c -> c.getStatus() == EmergencyRequestStatus.APPROVED || c.getStatus() == EmergencyRequestStatus.COMPLETED);
            boolean hasPending = claims.stream().anyMatch(c -> c.getStatus() == EmergencyRequestStatus.PENDING ||
                    c.getStatus() == EmergencyRequestStatus.UNDER_REVIEW ||
                    c.getStatus() == EmergencyRequestStatus.ADDITIONAL_INFORMATION_REQUIRED);

            owners.add(OwnerProfileSummaryDto.builder()
                    .ownerId(owner.getId())
                    .ownerName(ownerName)
                    .ownerEmail(owner.getEmail())
                    .ownerPhone(ownerPhone)
                    .relationship(b.getRelationship())
                    .invitationStatus(b.getInvitationStatus())
                    .assignedAssetsCount(assetCount)
                    .hasApprovedClaim(hasApproved)
                    .hasPendingClaim(hasPending)
                    .beneficiaryRecordId(b.getId())
                    .build());
        }

        return owners;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InheritedAssetDto> getInheritedAssets(Long userId, String email) {
        List<Beneficiary> records = beneficiaryRepository.findByUserIdOrEmail(userId, email);
        if (records.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> bIds = records.stream().map(Beneficiary::getId).toList();
        List<AssetBeneficiary> links = assetBeneficiaryRepository.findByBeneficiaryIdIn(bIds);
        List<AssetPermission> allPerms = assetPermissionRepository.findByBeneficiaryIdInAndIsRevokedFalse(bIds);
        List<EmergencyRequest> allClaims = emergencyRequestRepository.findByBeneficiaryIdIn(bIds);

        List<InheritedAssetDto> result = new ArrayList<>();

        for (AssetBeneficiary link : links) {
            DigitalAsset asset = link.getAsset();
            Beneficiary benRecord = link.getBeneficiary();

            // Find permissions specific to this asset & beneficiary
            List<AssetPermission> perms = allPerms.stream()
                    .filter(p -> p.getAsset().getId().equals(asset.getId()) && p.getBeneficiary().getId().equals(benRecord.getId()))
                    .toList();

            // Check if there is an approved emergency claim for this asset & beneficiary OR for this owner & beneficiary
            Optional<EmergencyRequest> approvedClaim = allClaims.stream()
                    .filter(c -> c.getBeneficiary().getId().equals(benRecord.getId()) &&
                            (c.getAsset() == null || c.getAsset().getId().equals(asset.getId())) &&
                            (c.getStatus() == EmergencyRequestStatus.APPROVED || c.getStatus() == EmergencyRequestStatus.COMPLETED))
                    .findFirst();

            Optional<EmergencyRequest> pendingClaim = allClaims.stream()
                    .filter(c -> c.getBeneficiary().getId().equals(benRecord.getId()) &&
                            (c.getAsset() == null || c.getAsset().getId().equals(asset.getId())) &&
                            (c.getStatus() == EmergencyRequestStatus.PENDING ||
                             c.getStatus() == EmergencyRequestStatus.UNDER_REVIEW ||
                             c.getStatus() == EmergencyRequestStatus.ADDITIONAL_INFORMATION_REQUIRED))
                    .findFirst();

            boolean hasDirectViewPerm = !perms.isEmpty() && perms.stream().anyMatch(p ->
                    !Boolean.TRUE.equals(p.getIsRevoked()) && (
                    p.getPermissionType() == PermissionType.VIEW ||
                    p.getPermissionType() == PermissionType.DOWNLOAD ||
                    p.getPermissionType() == PermissionType.TRANSFER)
            );

            boolean canViewSecret = approvedClaim.isPresent() && hasDirectViewPerm;

            String decryptedIdentifier = "••••••••••••••••";
            if (canViewSecret && asset.getAssetIdentifier() != null) {
                try {
                    decryptedIdentifier = encryptionUtil.decryptString(asset.getAssetIdentifier());
                } catch (Exception ex) {
                    decryptedIdentifier = "(Encrypted Reference)";
                }
            }

            List<UploadedFileDto> files = Collections.emptyList();
            if (canViewSecret) {
                files = uploadedFileRepository.findByAssetId(asset.getId()).stream()
                        .map(f -> UploadedFileDto.builder()
                                .id(f.getId())
                                .fileName(f.getFileName())
                                .fileSize(f.getFileSize())
                                .contentType(f.getContentType())
                                .isEncrypted(f.getIsEncrypted())
                                .checksum(f.getChecksum())
                                .uploadedAt(f.getCreatedAt())
                                .build())
                        .collect(Collectors.toList());
            }

            String ownerName = asset.getUser().getProfile() != null
                    ? asset.getUser().getProfile().getFullName()
                    : asset.getUser().getEmail();

            InheritedAssetDto dto = InheritedAssetDto.builder()
                    .id(asset.getId())
                    .name(asset.getName())
                    .categoryName(asset.getCategory() != null ? asset.getCategory().getName() : "General")
                    .categoryIcon(asset.getCategory() != null ? asset.getCategory().getIcon() : "bi-box")
                    .platformName(asset.getPlatformName())
                    .ownerId(asset.getUser().getId())
                    .ownerName(ownerName)
                    .ownerEmail(asset.getUser().getEmail())
                    .allocationPercentage(link.getAllocationPercentage())
                    .status(asset.getStatus())
                    .transferInstructions(canViewSecret ? asset.getTransferInstructions() : "Instructions locked until inheritance request approval")
                    .canViewSecret(canViewSecret)
                    .assetIdentifier(decryptedIdentifier)
                    .permissions(perms.stream().map(p -> p.getPermissionType().name()).toList())
                    .accessConditions(perms.stream().map(AssetPermission::getAccessCondition).filter(Objects::nonNull).toList())
                    .files(files)
                    .hasPendingClaim(pendingClaim.isPresent())
                    .claimStatus(approvedClaim.map(c -> c.getStatus().name()).orElse(pendingClaim.map(c -> c.getStatus().name()).orElse(null)))
                    .beneficiaryRecordId(benRecord.getId())
                    .build();

            result.add(dto);
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InheritedAssetDto> getAuthorizedDocuments(Long userId, String email) {
        return getInheritedAssets(userId, email).stream()
                .filter(InheritedAssetDto::isCanViewSecret)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadInheritedFile(Long userId, String email, Long assetId, Long fileId) {
        List<Beneficiary> records = beneficiaryRepository.findByUserIdOrEmail(userId, email);
        if (records.isEmpty()) {
            throw new AccessDeniedException("You are not registered as a beneficiary for any estate.");
        }

        List<Long> bIds = records.stream().map(Beneficiary::getId).toList();

        // Check if beneficiary is assigned to this asset
        boolean isAssigned = assetBeneficiaryRepository.findByBeneficiaryIdIn(bIds).stream()
                .anyMatch(link -> link.getAsset().getId().equals(assetId));

        if (!isAssigned) {
            throw new AccessDeniedException("This asset has not been assigned to your beneficiary account.");
        }

        // Check direct permissions
        boolean hasPermission = assetPermissionRepository.findByBeneficiaryIdInAndIsRevokedFalse(bIds).stream()
                .anyMatch(p -> p.getAsset().getId().equals(assetId) &&
                        (p.getPermissionType() == PermissionType.VIEW ||
                         p.getPermissionType() == PermissionType.DOWNLOAD ||
                         p.getPermissionType() == PermissionType.TRANSFER));

        // Check approved emergency / inheritance request
        boolean hasApprovedClaim = emergencyRequestRepository.findByBeneficiaryIdIn(bIds).stream()
                .anyMatch(c -> (c.getAsset() == null || c.getAsset().getId().equals(assetId)) &&
                        (c.getStatus() == EmergencyRequestStatus.APPROVED || c.getStatus() == EmergencyRequestStatus.COMPLETED));

        if (!hasApprovedClaim) {
            throw new AccessDeniedException("Access denied. An approved inheritance access claim is required to access private documents.");
        }

        if (!hasPermission) {
            throw new AccessDeniedException("Access denied. You do not have view or download permissions for this document.");
        }

        // Verify file belongs to asset
        UploadedFile file = uploadedFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found with ID: " + fileId));

        if (file.getAsset() == null || !file.getAsset().getId().equals(assetId)) {
            throw new ResourceNotFoundException("File does not belong to this asset");
        }

        // Load and decrypt file
        return fileStorageService.loadFileAsResource(fileId, file.getUser().getId(), true);
    }

    @Override
    @Transactional
    public UploadedFileDto uploadSupportingDocument(MultipartFile file, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UploadedFile uploaded = fileStorageService.storeFile(file, user, null);

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
