package com.digitallegacy.service;

import com.digitallegacy.dto.request.BeneficiaryRequestDto;
import com.digitallegacy.dto.response.BeneficiaryResponseDto;
import com.digitallegacy.dto.response.EmergencyRequestDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BeneficiaryService {

    BeneficiaryResponseDto createBeneficiary(Long userId, BeneficiaryRequestDto request);

    Page<BeneficiaryResponseDto> getUserBeneficiaries(Long userId, Pageable pageable);

    BeneficiaryResponseDto getBeneficiaryById(Long userId, Long beneficiaryId);

    BeneficiaryResponseDto updateBeneficiary(Long userId, Long beneficiaryId, BeneficiaryRequestDto request);

    void deleteBeneficiary(Long userId, Long beneficiaryId);

    Page<EmergencyRequestDto> getRequestsForBeneficiary(Long userId, Long beneficiaryId, Pageable pageable);

    BeneficiaryResponseDto resendInvitation(Long userId, Long beneficiaryId);
}
