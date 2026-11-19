package com.digitallegacy.repository;

import com.digitallegacy.entity.EmergencyRequest;
import com.digitallegacy.entity.enums.EmergencyRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyRequestRepository extends JpaRepository<EmergencyRequest, Long> {

    List<EmergencyRequest> findByOwnerId(Long ownerId);

    Page<EmergencyRequest> findByOwnerId(Long ownerId, Pageable pageable);

    Page<EmergencyRequest> findByBeneficiaryId(Long beneficiaryId, Pageable pageable);

    Page<EmergencyRequest> findByStatus(EmergencyRequestStatus status, Pageable pageable);

    long countByOwnerIdAndStatus(Long ownerId, EmergencyRequestStatus status);

    long countByStatus(EmergencyRequestStatus status);

    List<EmergencyRequest> findTop10ByOrderByCreatedAtDesc();

    List<EmergencyRequest> findByBeneficiaryIdIn(List<Long> beneficiaryIds);

    List<EmergencyRequest> findByBeneficiaryId(Long beneficiaryId);

    Page<EmergencyRequest> findByBeneficiaryIdIn(List<Long> beneficiaryIds, Pageable pageable);

    boolean existsByAssetIdAndBeneficiaryIdAndStatusIn(Long assetId, Long beneficiaryId, List<EmergencyRequestStatus> statuses);

    boolean existsByBeneficiaryIdAndOwnerIdAndStatusIn(Long beneficiaryId, Long ownerId, List<EmergencyRequestStatus> statuses);
}
