package com.digitallegacy.service;

import com.digitallegacy.dto.response.BeneficiaryInvitationDto;
import com.digitallegacy.dto.response.BeneficiaryPortalSummaryDto;
import com.digitallegacy.dto.response.InheritedAssetDto;
import com.digitallegacy.dto.response.OwnerProfileSummaryDto;
import com.digitallegacy.dto.response.UploadedFileDto;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BeneficiaryPortalService {

    BeneficiaryPortalSummaryDto getPortalSummary(Long userId, String email);

    List<BeneficiaryInvitationDto> getMyInvitations(Long userId, String email);

    void acceptInvitation(Long beneficiaryId, Long userId, String email);

    void declineInvitation(Long beneficiaryId, Long userId, String email);

    List<OwnerProfileSummaryDto> getMyOwners(Long userId, String email);

    List<InheritedAssetDto> getInheritedAssets(Long userId, String email);

    List<InheritedAssetDto> getAuthorizedDocuments(Long userId, String email);

    Resource downloadInheritedFile(Long userId, String email, Long assetId, Long fileId);

    UploadedFileDto uploadSupportingDocument(MultipartFile file, Long userId);
}
