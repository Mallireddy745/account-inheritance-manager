package com.digitallegacy.repository;

import com.digitallegacy.entity.DigitalAsset;
import com.digitallegacy.entity.enums.AssetStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DigitalAssetRepository extends JpaRepository<DigitalAsset, Long> {

    List<DigitalAsset> findByUserId(Long userId);

    Page<DigitalAsset> findByUserId(Long userId, Pageable pageable);

    Optional<DigitalAsset> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    long countByCategoryId(Long categoryId);

    Page<DigitalAsset> findByUserIdAndCategoryId(Long userId, Long categoryId, Pageable pageable);

    Page<DigitalAsset> findByUserIdAndStatus(Long userId, AssetStatus status, Pageable pageable);

    Page<DigitalAsset> findByNameContainingIgnoreCaseAndUserId(String name, Long userId, Pageable pageable);

    // Admin: search all assets by name
    Page<DigitalAsset> findByNameContainingIgnoreCase(String name, Pageable pageable);

    // Admin: filter by category name
    Page<DigitalAsset> findByCategory_NameContainingIgnoreCase(String categoryName, Pageable pageable);

    @Query("SELECT a.category.name, COUNT(a) FROM DigitalAsset a GROUP BY a.category.name")
    List<Object[]> countAssetsGroupedByCategory();

    @Query("SELECT a.category.name, COUNT(a) FROM DigitalAsset a WHERE a.user.id = :userId GROUP BY a.category.name")
    List<Object[]> countUserAssetsGroupedByCategory(@Param("userId") Long userId);
}
