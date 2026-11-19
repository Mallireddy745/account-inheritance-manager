package com.digitallegacy.repository;

import com.digitallegacy.entity.AssetPermission;
import com.digitallegacy.entity.enums.PermissionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetPermissionRepository extends JpaRepository<AssetPermission, Long> {

    List<AssetPermission> findByAssetId(Long assetId);

    List<AssetPermission> findByBeneficiaryId(Long beneficiaryId);

    List<AssetPermission> findByBeneficiaryIdAndIsRevokedFalse(Long beneficiaryId);

    List<AssetPermission> findByBeneficiaryIdInAndIsRevokedFalse(List<Long> beneficiaryIds);

    Optional<AssetPermission> findByAssetIdAndBeneficiaryIdAndPermissionType(
            Long assetId, Long beneficiaryId, PermissionType permissionType);

    @Query("SELECT p FROM AssetPermission p WHERE p.asset.user.id = :userId")
    List<AssetPermission> findByAssetOwnerId(@Param("userId") Long userId);

    @Query("SELECT COUNT(p) FROM AssetPermission p WHERE p.asset.user.id = :userId AND p.isRevoked = false")
    long countActivePermissionsByOwnerId(@Param("userId") Long userId);
}
