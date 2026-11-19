package com.digitallegacy.service.impl;

import com.digitallegacy.dto.request.EmergencyRequestCreateDto;
import com.digitallegacy.dto.response.EmergencyRequestDto;
import com.digitallegacy.entity.*;
import com.digitallegacy.entity.enums.ClaimType;
import com.digitallegacy.entity.enums.EmergencyRequestStatus;
import com.digitallegacy.entity.enums.NotificationType;
import com.digitallegacy.exception.DuplicateResourceException;
import com.digitallegacy.exception.ResourceNotFoundException;
import com.digitallegacy.repository.*;
import com.digitallegacy.service.AuditService;
import com.digitallegacy.service.EmergencyRequestService;
import com.digitallegacy.service.FileStorageService;
import com.digitallegacy.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmergencyRequestServiceImpl implements EmergencyRequestService {

    private final EmergencyRequestRepository emergencyRequestRepository;
    private final DigitalAssetRepository digitalAssetRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final AssetBeneficiaryRepository assetBeneficiaryRepository;
    private final UploadedFileRepository uploadedFileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    public EmergencyRequestDto submitRequest(EmergencyRequestCreateDto dto, Long currentUserId) {
        // Load or resolve the beneficiary record
        Beneficiary beneficiary = null;

        if (dto.getBeneficiaryId() != null) {
            beneficiary = beneficiaryRepository.findById(dto.getBeneficiaryId()).orElse(null);
        }

        if (beneficiary == null && currentUserId != null) {
            User currentUser = userRepository.findById(currentUserId).orElse(null);
            String email = currentUser != null ? currentUser.getEmail() : "";
            Long targetOwnerId = dto.getOwnerId();

            if (targetOwnerId == null && dto.getAssetId() != null) {
                DigitalAsset da = digitalAssetRepository.findById(dto.getAssetId()).orElse(null);
                if (da != null) {
                    targetOwnerId = da.getUser().getId();
                }
            }

            if (targetOwnerId != null) {
                beneficiary = beneficiaryRepository.findByOwnerIdAndEmail(targetOwnerId, email).orElse(null);
                if (beneficiary == null) {
                    beneficiary = beneficiaryRepository.findByOwnerId(targetOwnerId).stream()
                            .filter(b -> b.getBeneficiaryUser() != null && b.getBeneficiaryUser().getId().equals(currentUserId))
                            .findFirst()
                            .orElse(null);
                }
            }

            if (beneficiary == null) {
                List<Beneficiary> records = beneficiaryRepository.findByUserIdOrEmail(currentUserId, email);
                if (!records.isEmpty()) {
                    if (targetOwnerId != null) {
                        final Long finalOwnerId = targetOwnerId;
                        beneficiary = records.stream()
                                .filter(b -> b.getOwner().getId().equals(finalOwnerId))
                                .findFirst()
                                .orElse(records.get(0));
                    } else {
                        beneficiary = records.get(0);
                    }
                }
            }
        }

        if (beneficiary == null) {
            throw new ResourceNotFoundException("No designated beneficiary relationship found for this estate owner");
        }

        DigitalAsset asset = null;
        User owner;

        if (dto.getAssetId() != null) {
            asset = digitalAssetRepository.findById(dto.getAssetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + dto.getAssetId()));
            owner = asset.getUser();

            if (!beneficiary.getOwner().getId().equals(owner.getId())) {
                throw new ResourceNotFoundException("Beneficiary is not associated with this asset's owner");
            }

            boolean isAssignedToBeneficiary = assetBeneficiaryRepository
                    .findByAssetIdAndBeneficiaryId(dto.getAssetId(), beneficiary.getId())
                    .isPresent();

            if (!isAssignedToBeneficiary) {
                throw new AccessDeniedException("Access denied: This asset has not been designated to your beneficiary account");
            }

            boolean exists = emergencyRequestRepository.existsByAssetIdAndBeneficiaryIdAndStatusIn(
                    dto.getAssetId(), beneficiary.getId(),
                    List.of(EmergencyRequestStatus.PENDING, EmergencyRequestStatus.UNDER_REVIEW, EmergencyRequestStatus.ADDITIONAL_INFORMATION_REQUIRED));

            if (exists) {
                throw new DuplicateResourceException("An active request already exists for this asset and beneficiary");
            }
        } else {
            owner = beneficiary.getOwner();

            boolean exists = emergencyRequestRepository.existsByBeneficiaryIdAndOwnerIdAndStatusIn(
                    beneficiary.getId(), owner.getId(),
                    List.of(EmergencyRequestStatus.PENDING, EmergencyRequestStatus.UNDER_REVIEW, EmergencyRequestStatus.ADDITIONAL_INFORMATION_REQUIRED));

            if (exists) {
                throw new DuplicateResourceException("An active inheritance request already exists for this estate owner");
            }
        }

        UploadedFile evidenceFile = null;
        if (dto.getEvidenceFileId() != null) {
            evidenceFile = uploadedFileRepository.findById(dto.getEvidenceFileId()).orElse(null);
        }

        ClaimType claimType = dto.getClaimType() != null ? dto.getClaimType() : ClaimType.DEATH_VERIFICATION;

        EmergencyRequest request = EmergencyRequest.builder()
                .beneficiary(beneficiary)
                .owner(owner)
                .asset(asset)
                .claimType(claimType)
                .reason(dto.getReason())
                .evidenceFile(evidenceFile)
                .status(EmergencyRequestStatus.PENDING)
                .build();

        request = emergencyRequestRepository.save(request);

        // Send notification to the asset owner
        String targetDesc = asset != null ? "asset: " + asset.getName() : "entire designated estate";
        notificationService.sendNotification(
                owner.getId(),
                "Inheritance Access Request Submitted",
                "An inheritance access request (" + claimType.name().replace('_', ' ') + ") has been submitted by " +
                        beneficiary.getFullName() + " for your " + targetDesc + ".",
                NotificationType.EMERGENCY_REQUEST
        );

        // Log activity
        User currentUser = userRepository.findById(currentUserId).orElse(null);
        if (currentUser != null) {
            auditService.logUserActivity(currentUser, "INHERITANCE_REQUEST_SUBMITTED",
                    "Submitted inheritance request (" + claimType + ") for " + targetDesc, null, null);
        }

        log.info("Inheritance request {} submitted by beneficiary {} for owner {}",
                request.getId(), beneficiary.getFullName(), owner.getEmail());

        return toDto(request);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmergencyRequestDto> getRequestsByOwner(Long ownerId, Pageable pageable) {
        return emergencyRequestRepository.findByOwnerId(ownerId, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmergencyRequestDto> getRequestsByBeneficiaryUser(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId).orElse(null);
        String email = user != null ? user.getEmail() : "";

        List<Beneficiary> records = beneficiaryRepository.findByUserIdOrEmail(userId, email);
        if (records.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Long> bIds = records.stream().map(Beneficiary::getId).toList();
        return emergencyRequestRepository.findByBeneficiaryIdIn(bIds, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmergencyRequestDto> getAllRequests(EmergencyRequestStatus status, Pageable pageable) {
        if (status != null) {
            return emergencyRequestRepository.findByStatus(status, pageable).map(this::toDto);
        }
        return emergencyRequestRepository.findAll(pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EmergencyRequestDto> getAllRequestsFiltered(EmergencyRequestStatus status, String search, String claimType, Pageable pageable) {
        List<EmergencyRequest> all = emergencyRequestRepository.findAll();

        List<EmergencyRequest> filtered = all.stream()
                .filter(r -> {
                    if (status != null && r.getStatus() != status) return false;
                    if (claimType != null && !claimType.isBlank() && !r.getClaimType().name().equalsIgnoreCase(claimType)) return false;
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase();
                        boolean matchOwner = r.getOwner().getEmail().toLowerCase().contains(s) ||
                                (r.getOwner().getProfile() != null && r.getOwner().getProfile().getFullName().toLowerCase().contains(s));
                        boolean matchBene = r.getBeneficiary().getEmail().toLowerCase().contains(s) ||
                                r.getBeneficiary().getFullName().toLowerCase().contains(s);
                        boolean matchAsset = r.getAsset() != null && r.getAsset().getName().toLowerCase().contains(s);
                        return matchOwner || matchBene || matchAsset;
                    }
                    return true;
                })
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filtered.size());
        List<EmergencyRequestDto> content = (start <= end && start < filtered.size())
                ? filtered.subList(start, end).stream().map(this::toDto).collect(Collectors.toList())
                : List.of();

        return new PageImpl<>(content, pageable, filtered.size());
    }

    @Override
    @Transactional(readOnly = true)
    public EmergencyRequestDto getRequestById(Long id, Long currentUserId, boolean isAdminOrVerifier) {
        EmergencyRequest request = emergencyRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with id: " + id));

        if (!isAdminOrVerifier && !request.getOwner().getId().equals(currentUserId)) {
            // Also allow the beneficiary user to view their own request
            boolean isBeneUser = request.getBeneficiary().getBeneficiaryUser() != null &&
                    request.getBeneficiary().getBeneficiaryUser().getId().equals(currentUserId);
            if (!isBeneUser) {
                throw new AccessDeniedException("Access denied to emergency request with id: " + id);
            }
        }

        return toDto(request);
    }

    @Override
    @Transactional
    public EmergencyRequestDto approveRequest(Long requestId, Long verifierOrAdminId, String notes) {
        EmergencyRequest request = emergencyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with id: " + requestId));

        if (request.getStatus() != EmergencyRequestStatus.PENDING
                && request.getStatus() != EmergencyRequestStatus.UNDER_REVIEW
                && request.getStatus() != EmergencyRequestStatus.ADDITIONAL_INFORMATION_REQUIRED) {
            throw new IllegalStateException("Request cannot be approved in its current status: " + request.getStatus());
        }

        User reviewer = userRepository.findById(verifierOrAdminId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer user not found"));

        request.setStatus(EmergencyRequestStatus.APPROVED);
        request.setReviewedByAdmin(reviewer);
        request.setAdminNotes(notes);
        request.setVerificationNotes(notes);
        request.setReviewedAt(LocalDateTime.now());
        emergencyRequestRepository.save(request);

        String assetName = request.getAsset() != null ? request.getAsset().getName() : "designated estate assets";

        // Notify the beneficiary
        User beneficiaryUser = request.getBeneficiary().getBeneficiaryUser();
        if (beneficiaryUser != null) {
            notificationService.sendNotification(
                    beneficiaryUser.getId(),
                    "Inheritance Request Approved",
                    "Your inheritance access request for '" + assetName + "' has been APPROVED. Authorized assets are now unlocked in your dashboard.",
                    NotificationType.EMERGENCY_REQUEST
            );
        }

        // Notify the owner
        notificationService.sendNotification(
                request.getOwner().getId(),
                "Inheritance Request Approved",
                "Inheritance access request for '" + assetName + "' has been approved by verification officer " + reviewer.getEmail() + ".",
                NotificationType.EMERGENCY_REQUEST
        );

        auditService.logAdminAction(reviewer, "APPROVE_INHERITANCE_REQUEST", "EmergencyRequest",
                requestId, "Approved inheritance request. Notes: " + (notes != null ? notes : "Verified and approved"), null);

        return toDto(request);
    }

    @Override
    @Transactional
    public EmergencyRequestDto rejectRequest(Long requestId, Long verifierOrAdminId, String reason) {
        EmergencyRequest request = emergencyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with id: " + requestId));

        if (request.getStatus() != EmergencyRequestStatus.PENDING
                && request.getStatus() != EmergencyRequestStatus.UNDER_REVIEW
                && request.getStatus() != EmergencyRequestStatus.ADDITIONAL_INFORMATION_REQUIRED) {
            throw new IllegalStateException("Request cannot be rejected in its current status: " + request.getStatus());
        }

        User reviewer = userRepository.findById(verifierOrAdminId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer user not found"));

        request.setStatus(EmergencyRequestStatus.REJECTED);
        request.setReviewedByAdmin(reviewer);
        request.setAdminNotes(reason);
        request.setVerificationNotes(reason);
        request.setReviewedAt(LocalDateTime.now());
        emergencyRequestRepository.save(request);

        String assetName = request.getAsset() != null ? request.getAsset().getName() : "designated estate assets";

        User beneficiaryUser = request.getBeneficiary().getBeneficiaryUser();
        if (beneficiaryUser != null) {
            notificationService.sendNotification(
                    beneficiaryUser.getId(),
                    "Inheritance Request Rejected",
                    "Your inheritance access request for '" + assetName + "' was rejected." +
                            (reason != null ? " Reason: " + reason : ""),
                    NotificationType.EMERGENCY_REQUEST
            );
        }

        notificationService.sendNotification(
                request.getOwner().getId(),
                "Inheritance Request Rejected",
                "Inheritance access request for '" + assetName + "' was rejected by verification officer.",
                NotificationType.EMERGENCY_REQUEST
        );

        auditService.logAdminAction(reviewer, "REJECT_INHERITANCE_REQUEST", "EmergencyRequest",
                requestId, "Rejected inheritance request. Reason: " + (reason != null ? reason : "Documentation insufficient"), null);

        return toDto(request);
    }

    @Override
    @Transactional
    public EmergencyRequestDto requestAdditionalInfo(Long requestId, Long verifierOrAdminId, String notes) {
        EmergencyRequest request = emergencyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with id: " + requestId));

        User reviewer = userRepository.findById(verifierOrAdminId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer user not found"));

        request.setStatus(EmergencyRequestStatus.ADDITIONAL_INFORMATION_REQUIRED);
        request.setReviewedByAdmin(reviewer);
        request.setVerificationNotes(notes);
        request.setAdminNotes(notes);
        request.setReviewedAt(LocalDateTime.now());
        emergencyRequestRepository.save(request);

        String assetName = request.getAsset() != null ? request.getAsset().getName() : "designated estate assets";

        User beneficiaryUser = request.getBeneficiary().getBeneficiaryUser();
        if (beneficiaryUser != null) {
            notificationService.sendNotification(
                    beneficiaryUser.getId(),
                    "Additional Information Required",
                    "Verification officer requested additional documentation for your inheritance request on '" +
                            assetName + "': " + notes,
                    NotificationType.EMERGENCY_REQUEST
            );
        }

        auditService.logAdminAction(reviewer, "REQUEST_ADDITIONAL_INFO", "EmergencyRequest",
                requestId, "Requested additional documentation: " + notes, null);

        return toDto(request);
    }

    @Override
    @Transactional
    public EmergencyRequestDto markUnderReview(Long requestId, Long verifierOrAdminId) {
        EmergencyRequest request = emergencyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with id: " + requestId));

        User reviewer = userRepository.findById(verifierOrAdminId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer user not found"));

        request.setStatus(EmergencyRequestStatus.UNDER_REVIEW);
        request.setReviewedByAdmin(reviewer);
        request.setReviewedAt(LocalDateTime.now());
        emergencyRequestRepository.save(request);

        auditService.logAdminAction(reviewer, "REVIEW_STARTED", "EmergencyRequest",
                requestId, "Marked inheritance request as UNDER_REVIEW", null);

        return toDto(request);
    }

    @Override
    @Transactional
    public EmergencyRequestDto cancelRequest(Long requestId, Long ownerId) {
        EmergencyRequest request = emergencyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency request not found with id: " + requestId));

        if (!request.getOwner().getId().equals(ownerId)) {
            throw new ResourceNotFoundException("Emergency request not found with id: " + requestId);
        }

        if (request.getStatus() != EmergencyRequestStatus.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be cancelled");
        }

        request.setStatus(EmergencyRequestStatus.REJECTED);
        request.setAdminNotes("Cancelled by asset owner");
        request.setReviewedAt(LocalDateTime.now());
        emergencyRequestRepository.save(request);

        return toDto(request);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadEvidenceDocument(Long requestId, Long currentUserId, boolean isAdminOrVerifier) {
        EmergencyRequest request = emergencyRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found with id: " + requestId));

        if (request.getEvidenceFile() == null) {
            throw new ResourceNotFoundException("No evidence document attached to this request");
        }

        // Verification authorization check
        if (!isAdminOrVerifier && !request.getOwner().getId().equals(currentUserId)) {
            boolean isBeneUser = request.getBeneficiary().getBeneficiaryUser() != null &&
                    request.getBeneficiary().getBeneficiaryUser().getId().equals(currentUserId);
            if (!isBeneUser) {
                throw new AccessDeniedException("Access denied to evidence document");
            }
        }

        return fileStorageService.loadFileAsResource(request.getEvidenceFile().getId(), request.getEvidenceFile().getUser().getId(), true);
    }

    private EmergencyRequestDto toDto(EmergencyRequest r) {
        String ownerName = r.getOwner().getProfile() != null ? r.getOwner().getProfile().getFullName() : r.getOwner().getEmail();
        String assetName = r.getAsset() != null ? r.getAsset().getName() : "All Designated Estate Assets";
        Long assetId = r.getAsset() != null ? r.getAsset().getId() : null;

        String reviewerName = null;
        if (r.getReviewedByAdmin() != null) {
            reviewerName = r.getReviewedByAdmin().getProfile() != null
                    ? r.getReviewedByAdmin().getProfile().getFullName()
                    : r.getReviewedByAdmin().getEmail();
        }

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
                .reviewedByAdminName(reviewerName)
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
