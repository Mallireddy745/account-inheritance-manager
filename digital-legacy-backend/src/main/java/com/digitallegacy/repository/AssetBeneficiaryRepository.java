package com.digitallegacy.repository;

import com.digitallegacy.entity.AssetBeneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetBeneficiaryRepository extends JpaRepository<AssetBeneficiary, Long> {

    List<AssetBeneficiary> findByAssetId(Long assetId);

    List<AssetBeneficiary> findByBeneficiaryId(Long beneficiaryId);

    List<AssetBeneficiary> findByBeneficiaryIdIn(List<Long> beneficiaryIds);

    Optional<AssetBeneficiary> findByAssetIdAndBeneficiaryId(Long assetId, Long beneficiaryId);

    void deleteByAssetIdAndBeneficiaryId(Long assetId, Long beneficiaryId);
}
