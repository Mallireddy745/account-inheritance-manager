package com.digitallegacy.controller;

import com.digitallegacy.dto.request.AssetRequestDto;
import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.AssetResponseDto;
import com.digitallegacy.dto.response.UploadedFileDto;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.AssetService;
import com.digitallegacy.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
@Tag(name = "Digital Assets Management", description = "Endpoints for creating, managing, categorizing, and securing digital legacy assets")
public class AssetController {

    private final AssetService assetService;
    private final FileStorageService fileStorageService;

    @GetMapping
    @Operation(summary = "List all digital assets belonging to the authenticated user")
    public ResponseEntity<ApiResponse<Page<AssetResponseDto>>> getUserAssets(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<AssetResponseDto> assets = assetService.getUserAssets(currentUser.getId(), categoryId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Assets retrieved successfully", assets));
    }

    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    @Operation(summary = "Create a new digital asset with optional supporting document attachments")
    public ResponseEntity<ApiResponse<AssetResponseDto>> createAsset(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestPart("asset") AssetRequestDto request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {

        AssetResponseDto response = assetService.createAsset(currentUser.getId(), request, files);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Digital asset created successfully", response));
    }

    @PostMapping("/simple")
    @Operation(summary = "Create a new digital asset (JSON only payload)")
    public ResponseEntity<ApiResponse<AssetResponseDto>> createAssetSimple(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AssetRequestDto request) {

        AssetResponseDto response = assetService.createAsset(currentUser.getId(), request, null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Digital asset created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve digital asset details by ID")
    public ResponseEntity<ApiResponse<AssetResponseDto>> getAssetById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        AssetResponseDto asset = assetService.getAssetById(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Asset details retrieved successfully", asset));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update digital asset information")
    public ResponseEntity<ApiResponse<AssetResponseDto>> updateAsset(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody AssetRequestDto request) {

        AssetResponseDto updated = assetService.updateAsset(currentUser.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Asset updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete digital asset")
    public ResponseEntity<ApiResponse<Void>> deleteAsset(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id) {

        assetService.deleteAsset(currentUser.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Digital asset deleted successfully"));
    }

    @GetMapping("/{id}/download-file/{fileId}")
    @Operation(summary = "Securely download decrypted supporting document attachment")
    public ResponseEntity<Resource> downloadFile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @PathVariable Long fileId) {

        // Validate asset ownership
        assetService.getAssetById(currentUser.getId(), id);

        Resource resource = fileStorageService.loadFileAsResource(fileId, currentUser.getId(), false);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload supporting document attachment to an existing asset")
    public ResponseEntity<ApiResponse<UploadedFileDto>> uploadAssetFile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        UploadedFileDto uploaded = assetService.uploadFileToAsset(currentUser.getId(), id, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Supporting file uploaded and encrypted successfully", uploaded));
    }

    @GetMapping("/{id}/preview-file/{fileId}")
    @Operation(summary = "Preview/Watch decrypted supporting document inline without downloading (SecurityLocker style)")
    public ResponseEntity<Resource> previewFile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @PathVariable Long fileId) {

        // Validate asset ownership
        assetService.getAssetById(currentUser.getId(), id);
        Resource resource = fileStorageService.loadFileAsResource(fileId, currentUser.getId(), false);

        String filename = resource.getFilename() != null ? resource.getFilename().toLowerCase() : "";
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (filename.endsWith(".pdf")) {
            mediaType = MediaType.APPLICATION_PDF;
        } else if (filename.endsWith(".png")) {
            mediaType = MediaType.IMAGE_PNG;
        } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            mediaType = MediaType.IMAGE_JPEG;
        } else if (filename.endsWith(".gif")) {
            mediaType = MediaType.IMAGE_GIF;
        } else if (filename.endsWith(".txt")) {
            mediaType = MediaType.TEXT_PLAIN;
        } else if (filename.endsWith(".html")) {
            mediaType = MediaType.TEXT_HTML;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}/files/{fileId}")
    @Operation(summary = "Delete an uploaded supporting document from an asset")
    public ResponseEntity<ApiResponse<Void>> deleteAssetFile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @PathVariable Long fileId) {

        // Validate asset ownership
        assetService.getAssetById(currentUser.getId(), id);
        fileStorageService.deleteFile(fileId, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Supporting file deleted successfully"));
    }
}
