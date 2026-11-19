package com.digitallegacy.service;

import com.digitallegacy.dto.request.EmergencyRequestCreateDto;
import com.digitallegacy.dto.response.EmergencyRequestDto;
import com.digitallegacy.entity.enums.EmergencyRequestStatus;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EmergencyRequestService {

    EmergencyRequestDto submitRequest(EmergencyRequestCreateDto dto, Long currentUserId);

    Page<EmergencyRequestDto> getRequestsByOwner(Long ownerId, Pageable pageable);

    Page<EmergencyRequestDto> getRequestsByBeneficiaryUser(Long userId, Pageable pageable);

    Page<EmergencyRequestDto> getAllRequests(EmergencyRequestStatus status, Pageable pageable);

    Page<EmergencyRequestDto> getAllRequestsFiltered(EmergencyRequestStatus status, String search, String claimType, Pageable pageable);

    EmergencyRequestDto getRequestById(Long id, Long currentUserId, boolean isAdminOrVerifier);

    EmergencyRequestDto approveRequest(Long requestId, Long verifierOrAdminId, String notes);

    EmergencyRequestDto rejectRequest(Long requestId, Long verifierOrAdminId, String reason);

    EmergencyRequestDto requestAdditionalInfo(Long requestId, Long verifierOrAdminId, String notes);

    EmergencyRequestDto markUnderReview(Long requestId, Long verifierOrAdminId);

    EmergencyRequestDto cancelRequest(Long requestId, Long ownerId);

    Resource loadEvidenceDocument(Long requestId, Long currentUserId, boolean isAdminOrVerifier);
}
