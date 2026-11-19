package com.digitallegacy.service;

import com.digitallegacy.dto.request.AssetRequestDto;
import com.digitallegacy.dto.response.AssetCategoryDto;
import com.digitallegacy.dto.response.AssetResponseDto;
import com.digitallegacy.dto.response.UploadedFileDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AssetService {

    AssetResponseDto createAsset(Long userId, AssetRequestDto request, List<MultipartFile> files);

    Page<AssetResponseDto> getUserAssets(Long userId, Long categoryId, String search, Pageable pageable);

    AssetResponseDto getAssetById(Long userId, Long assetId);

    AssetResponseDto updateAsset(Long userId, Long assetId, AssetRequestDto request);

    void deleteAsset(Long userId, Long assetId);

    List<AssetCategoryDto> getAllActiveCategories();

    UploadedFileDto uploadFileToAsset(Long userId, Long assetId, MultipartFile file);
}
