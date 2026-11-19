package com.digitallegacy.repository;

import com.digitallegacy.entity.VerificationRecord;
import com.digitallegacy.entity.enums.VerificationRecordStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VerificationRecordRepository extends JpaRepository<VerificationRecord, Long> {

    List<VerificationRecord> findByBeneficiaryId(Long beneficiaryId);

    Page<VerificationRecord> findByStatus(VerificationRecordStatus status, Pageable pageable);

    long countByStatus(VerificationRecordStatus status);
}
