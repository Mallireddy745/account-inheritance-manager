package com.digitallegacy.service.impl;

import com.digitallegacy.entity.DigitalAsset;
import com.digitallegacy.entity.UploadedFile;
import com.digitallegacy.entity.User;
import com.digitallegacy.exception.ResourceNotFoundException;
import com.digitallegacy.repository.UploadedFileRepository;
import com.digitallegacy.service.FileStorageService;
import com.digitallegacy.util.EncryptionUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private final UploadedFileRepository uploadedFileRepository;
    private final EncryptionUtil encryptionUtil;

    @Value("${app.storage.upload-dir:./uploads/documents}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "pdf", "jpg", "jpeg", "png", "doc", "docx", "txt", "xlsx"
    );

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            log.error("Could not create upload directory: {}", ex.getMessage());
            throw new RuntimeException("Could not create upload directory", ex);
        }
    }

    @Override
    @Transactional
    public UploadedFile storeFile(MultipartFile file, User user, DigitalAsset asset) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum permitted limit of 25 MB");
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document");
        if (originalFileName.contains("..")) {
            throw new IllegalArgumentException("Invalid file path sequence: " + originalFileName);
        }

        String extension = getFileExtension(originalFileName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file extension ." + extension + ". Allowed: " + ALLOWED_EXTENSIONS);
        }

        try {
            byte[] fileBytes = file.getBytes();
            String checksum = calculateSha256(fileBytes);

            // AES-256 Encryption of file bytes before writing to disk
            byte[] encryptedBytes = encryptionUtil.encrypt(fileBytes);

            String storedFileName = UUID.randomUUID().toString() + ".enc";
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);

            Files.write(targetLocation, encryptedBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            UploadedFile uploadedFile = UploadedFile.builder()
                    .user(user)
                    .asset(asset)
                    .fileName(originalFileName)
                    .storedFileName(storedFileName)
                    .filePath(targetLocation.toString())
                    .fileSize(file.getSize())
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .isEncrypted(true)
                    .checksum(checksum)
                    .build();

            return uploadedFileRepository.save(uploadedFile);

        } catch (Exception ex) {
            log.error("Failed to store encrypted file {}: {}", originalFileName, ex.getMessage());
            throw new RuntimeException("Failed to store file securely", ex);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadFileAsResource(Long fileId, Long currentUserId, boolean isAdmin) {
        UploadedFile uploadedFile = uploadedFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found with ID: " + fileId));

        // Ownership verification (Zero-Trust IDOR Protection)
        if (!isAdmin && !uploadedFile.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have authorization to access this file");
        }

        try {
            Path filePath = Paths.get(uploadedFile.getFilePath());
            if (!Files.exists(filePath)) {
                Path alt = this.fileStorageLocation.resolve(uploadedFile.getStoredFileName());
                if (Files.exists(alt)) {
                    filePath = alt;
                } else {
                    Path backendRelative = Paths.get("digital-legacy-backend/uploads/documents").resolve(uploadedFile.getStoredFileName());
                    if (Files.exists(backendRelative)) {
                        filePath = backendRelative;
                    } else {
                        throw new ResourceNotFoundException("Physical file not found on storage disk");
                    }
                }
            }

            byte[] encryptedBytes = Files.readAllBytes(filePath);
            byte[] decryptedBytes = uploadedFile.getIsEncrypted()
                    ? encryptionUtil.decrypt(encryptedBytes)
                    : encryptedBytes;

            return new ByteArrayResource(decryptedBytes) {
                @Override
                public String getFilename() {
                    return uploadedFile.getFileName();
                }
            };

        } catch (Exception ex) {
            log.error("Failed to read file {}: {}", uploadedFile.getFileName(), ex.getMessage());
            throw new RuntimeException("Could not read file", ex);
        }
    }

    @Override
    @Transactional
    public void deleteFile(Long fileId, Long currentUserId) {
        UploadedFile uploadedFile = uploadedFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found with ID: " + fileId));

        if (!uploadedFile.getUser().getId().equals(currentUserId)) {
            throw new AccessDeniedException("You do not have permission to delete this file");
        }

        try {
            Path filePath = Paths.get(uploadedFile.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("Failed to delete physical file from disk: {}", e.getMessage());
        }

        if (uploadedFile.getAsset() != null) {
            uploadedFile.getAsset().getFiles().remove(uploadedFile);
        }

        uploadedFileRepository.delete(uploadedFile);
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return dotIndex > 0 ? fileName.substring(dotIndex + 1) : "";
    }

    private String calculateSha256(byte[] data) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data);
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
