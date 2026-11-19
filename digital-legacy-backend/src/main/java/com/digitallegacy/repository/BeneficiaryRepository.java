package com.digitallegacy.repository;

import com.digitallegacy.entity.Beneficiary;
import com.digitallegacy.entity.enums.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeneficiaryRepository extends JpaRepository<Beneficiary, Long> {

    List<Beneficiary> findByOwnerId(Long ownerId);

    Page<Beneficiary> findByOwnerId(Long ownerId, Pageable pageable);

    Optional<Beneficiary> findByIdAndOwnerId(Long id, Long ownerId);

    Optional<Beneficiary> findByOwnerIdAndEmail(Long ownerId, String email);

    boolean existsByOwnerIdAndEmail(Long ownerId, String email);

    long countByOwnerId(Long ownerId);

    List<Beneficiary> findByEmail(String email);

    List<Beneficiary> findByEmailIgnoreCase(String email);

    List<Beneficiary> findByBeneficiaryUserId(Long beneficiaryUserId);

    @org.springframework.data.jpa.repository.Query("SELECT b FROM Beneficiary b WHERE b.beneficiaryUser.id = :userId OR LOWER(b.email) = LOWER(:email)")
    List<Beneficiary> findByUserIdOrEmail(@org.springframework.data.repository.query.Param("userId") Long userId, @org.springframework.data.repository.query.Param("email") String email);

    Page<Beneficiary> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    Optional<Beneficiary> findByInvitationToken(String invitationToken);

    long countByVerificationStatus(VerificationStatus status);

    // Admin: search by name or email
    Page<Beneficiary> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String fullName, String email, Pageable pageable);
}
