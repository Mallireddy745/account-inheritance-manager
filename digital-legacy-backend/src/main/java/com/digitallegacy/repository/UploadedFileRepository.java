package com.digitallegacy.repository;

import com.digitallegacy.entity.UploadedFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UploadedFileRepository extends JpaRepository<UploadedFile, Long> {

    List<UploadedFile> findByAssetId(Long assetId);

    List<UploadedFile> findByUserId(Long userId);

    Optional<UploadedFile> findByStoredFileName(String storedFileName);
}
