package com.digitallegacy.service;

import com.digitallegacy.entity.DigitalAsset;
import com.digitallegacy.entity.UploadedFile;
import com.digitallegacy.entity.User;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    UploadedFile storeFile(MultipartFile file, User user, DigitalAsset asset);

    Resource loadFileAsResource(Long fileId, Long currentUserId, boolean isAdmin);

    void deleteFile(Long fileId, Long currentUserId);
}
