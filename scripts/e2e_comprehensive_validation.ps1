# ==============================================================================
# Comprehensive E2E Test Suite for Digital Legacy Manager
# Tests:
#   1. User Profile: Registration, Login, Profile View/Edit, Password Change
#   2. Connection Between Users (Owner -> Beneficiary): Invitation, Linking, Inheritance Access
#   3. Emergency Request / Claim Submission
#   4. Verifier Section: Login, Review claims, inspect evidence, under-review, approve/reject
#   5. SecurityLocker / Decrypted Document Access & Streaming
#   6. Admin Section: Authentication isolation, dashboard, users, audit logs, settings
# ==============================================================================

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

$ownerEmail = "owner_$timestamp@example.com"
$ownerPassword = "Password@123"
$ownerNewPassword = "NewPassword@123"
$beneEmail = "beneficiary_$timestamp@example.com"
$benePassword = "BenePassword@123"
$verifierEmail = "verifier@digitallegacy.com"
$verifierPassword = "Verifier@12345"
$adminEmail = "admin@digitallegacy.com"
$adminPassword = "Admin@123"

$passedCount = 0
$failedCount = 0

function Assert-Test($name, $condition, $msg) {
    if ($condition) {
        Write-Host " [PASS] $name" -ForegroundColor Green
        $global:passedCount++
    } else {
        Write-Host " [FAIL] $($name): $msg" -ForegroundColor Red
        $global:failedCount++
        throw "Assertion failed for $($name): $msg"
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "STARTING COMPREHENSIVE E2E VERIFICATION SUITE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# SECTION 1: USER PROFILE & CREDENTIAL MANAGEMENT
# ------------------------------------------------------------------------------
Write-Host "`n--- SECTION 1: USER PROFILE & CREDENTIAL MANAGEMENT ---" -ForegroundColor Yellow

# 1.1 Register Owner User
$regPayload = @{
    fullName = "E2E Owner User"
    email = $ownerEmail
    password = $ownerPassword
    phoneNumber = "+19998887771"
    termsConsent = $true
} | ConvertTo-Json

$regResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $regPayload -ContentType "application/json"
Assert-Test "User Registration" ($regResp.success -eq $true -and $regResp.data.email -eq $ownerEmail) "Registration response success was false"
$ownerToken = $regResp.data.token
$ownerHeaders = @{ Authorization = "Bearer $ownerToken" }

# 1.2 Get User Profile
$profResp = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Get -Headers $ownerHeaders
Assert-Test "Get Profile" ($profResp.success -eq $true -and $profResp.data.fullName -eq "E2E Owner User") "Profile details mismatch"

# 1.3 Update User Profile
$updateProfPayload = @{
    fullName = "E2E Owner Updated"
    phoneNumber = "+19998887779"
    address = "456 Legacy Way, Cloud City"
} | ConvertTo-Json

$updateProfResp = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Put -Body $updateProfPayload -Headers $ownerHeaders -ContentType "application/json"
Assert-Test "Update Profile" ($updateProfResp.success -eq $true -and $updateProfResp.data.fullName -eq "E2E Owner Updated") "Profile update failed"

# Verify fetched profile reflects update
$profCheckResp = Invoke-RestMethod -Uri "$baseUrl/api/users/profile" -Method Get -Headers $ownerHeaders
Assert-Test "Verify Updated Profile" ($profCheckResp.data.address -eq "456 Legacy Way, Cloud City" -and $profCheckResp.data.fullName -eq "E2E Owner Updated") "Profile fields do not match update"

# 1.4 Change User Password
$pwdPayload = @{
    currentPassword = $ownerPassword
    newPassword = $ownerNewPassword
    confirmNewPassword = $ownerNewPassword
} | ConvertTo-Json

$pwdResp = Invoke-RestMethod -Uri "$baseUrl/api/users/change-password" -Method Put -Body $pwdPayload -Headers $ownerHeaders -ContentType "application/json"
Assert-Test "Change Password" ($pwdResp.success -eq $true) "Password change failed"

# 1.5 Re-authenticate with new password
$loginPayload = @{
    email = $ownerEmail
    password = $ownerNewPassword
} | ConvertTo-Json

$loginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
Assert-Test "Login with New Password" ($loginResp.success -eq $true -and $loginResp.data.token) "Login with new password failed"
$ownerToken = $loginResp.data.token
$ownerHeaders = @{ Authorization = "Bearer $ownerToken" }


# ------------------------------------------------------------------------------
# SECTION 2: CONNECTION BETWEEN USERS (OWNER & BENEFICIARY)
# ------------------------------------------------------------------------------
Write-Host "`n--- SECTION 2: CONNECTION BETWEEN USERS (OWNER & BENEFICIARY) ---" -ForegroundColor Yellow

# 2.1 Owner designates a Beneficiary
$benePayload = @{
    fullName = "Jane Beneficiary"
    email = $beneEmail
    phoneNumber = "+19995554443"
    relationship = "SPOUSE"
    address = "123 Family Circle"
} | ConvertTo-Json

$beneCreateResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiaries" -Method Post -Body $benePayload -Headers $ownerHeaders -ContentType "application/json"
Assert-Test "Owner Adds Beneficiary" ($beneCreateResp.success -eq $true -and $beneCreateResp.data.id -gt 0) "Beneficiary creation failed"
$beneficiaryId = $beneCreateResp.data.id

# 2.2 Owner creates an Asset assigned to this Beneficiary
$assetPayload = @{
    name = "Family Trust & Swiss Account Vault"
    categoryId = 8 # Personal & Legal Documents
    platformName = "Swiss Private Bank & Notary"
    assetIdentifier = "ACC-SWISS-998822-SECRET"
    description = "Confidential family estate trust instructions and backup credentials"
    transferInstructions = "Release bank access tokens upon legal death verification certificate."
    beneficiaryIds = @($beneficiaryId)
} | ConvertTo-Json

$assetResp = Invoke-RestMethod -Uri "$baseUrl/api/assets/simple" -Method Post -Body $assetPayload -Headers $ownerHeaders -ContentType "application/json"
Assert-Test "Create Asset Assigned to Beneficiary" ($assetResp.success -eq $true -and $assetResp.data.id -gt 0) "Asset creation failed"
$assetId = $assetResp.data.id

# 2.3 Owner uploads an encrypted supporting document to the asset
$tempDocPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "family_will_document.pdf")
[System.IO.File]::WriteAllBytes($tempDocPath, [System.Text.Encoding]::UTF8.GetBytes("%PDF-1.4 Mock Legal Estate Document Content for Testing"))

$uploadFileBoundary = [System.Guid]::NewGuid().ToString()
$fileBytes = [System.IO.File]::ReadAllBytes($tempDocPath)
$fileContent = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes)

$bodyLines = @(
    "--$uploadFileBoundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"family_will_document.pdf`"",
    "Content-Type: application/pdf",
    "",
    $fileContent,
    "--$uploadFileBoundary--"
)
$uploadBody = [string]::Join("`r`n", $bodyLines)

$uploadDocResp = Invoke-RestMethod -Uri "$baseUrl/api/assets/$assetId/files" -Method Post -Body $uploadBody `
    -Headers @{ Authorization = "Bearer $ownerToken"; "Content-Type" = "multipart/form-data; boundary=$uploadFileBoundary" }
Assert-Test "Upload Encrypted Asset Document" ($uploadDocResp.success -eq $true -and $uploadDocResp.data.id -gt 0) "Asset file upload failed"
$uploadedDocId = $uploadDocResp.data.id

# 2.4 Beneficiary Registers Account
$beneRegPayload = @{
    fullName = "Jane Beneficiary"
    email = $beneEmail
    password = $benePassword
    phoneNumber = "+19995554443"
    termsConsent = $true
} | ConvertTo-Json

$beneRegResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $beneRegPayload -ContentType "application/json"
Assert-Test "Beneficiary User Registration & Auto-Link" ($beneRegResp.success -eq $true -and ($beneRegResp.data.isBeneficiary -eq $true -or $beneRegResp.data.beneficiary -eq $true)) "Beneficiary registration/auto-link failed"
$beneToken = $beneRegResp.data.token
$beneHeaders = @{ Authorization = "Bearer $beneToken" }

# 2.5 Beneficiary checks Portal Summary
$beneSummaryResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiaries" -Method Get -Headers $beneHeaders -ErrorAction SilentlyContinue
# Check Beneficiary Portal Summary
$portalSummaryResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiary-portal/summary" -Method Get -Headers $beneHeaders
Assert-Test "Beneficiary Portal Summary" ($portalSummaryResp.success -eq $true) "Failed to load portal summary"

# 2.6 Beneficiary checks Invitations & Accepts
$invitationsResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiary-portal/invitations" -Method Get -Headers $beneHeaders
Assert-Test "Beneficiary Receives Invitations" ($invitationsResp.success -eq $true -and $invitationsResp.data.Count -ge 1) "No invitations received"
$invitationId = $invitationsResp.data[0].id

$acceptResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiary-portal/invitations/$invitationId/accept" -Method Post -Headers $beneHeaders
Assert-Test "Beneficiary Accepts Invitation" ($acceptResp.success -eq $true) "Invitation accept failed"

# 2.7 Beneficiary Views Inherited Assets (Prior to claim approval, assetIdentifier is locked)
$inheritedResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiary-portal/assets" -Method Get -Headers $beneHeaders
Assert-Test "Beneficiary Views Designated Assets" ($inheritedResp.success -eq $true -and $inheritedResp.data.Count -ge 1) "No inherited assets listed"
$inheritedAsset = $inheritedResp.data[0]
Write-Host "DEBUG InheritedAsset: $($inheritedAsset | ConvertTo-Json -Depth 3)"
$isLocked = ($inheritedAsset.canViewSecret -eq $false -or $inheritedAsset.canViewSecret -eq $null) -and ($inheritedAsset.assetIdentifier -ne "ACC-SWISS-998822-SECRET")
Assert-Test "Asset Locked Before Approval" $isLocked "Sensitive details were not locked"


# ------------------------------------------------------------------------------
# SECTION 3: INHERITANCE CLAIM SUBMISSION & EVIDENCE UPLOAD
# ------------------------------------------------------------------------------
Write-Host "`n--- SECTION 3: INHERITANCE CLAIM & EVIDENCE UPLOAD ---" -ForegroundColor Yellow

# 3.1 Beneficiary uploads legal evidence document (e.g. death certificate)
$tempCertPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "death_certificate_evidence.pdf")
[System.IO.File]::WriteAllBytes($tempCertPath, [System.Text.Encoding]::UTF8.GetBytes("%PDF-1.4 Official Medical Death Certificate Evidence Document"))

$certBytes = [System.IO.File]::ReadAllBytes($tempCertPath)
$certContent = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($certBytes)
$certBoundary = [System.Guid]::NewGuid().ToString()

$certLines = @(
    "--$certBoundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"death_certificate_evidence.pdf`"",
    "Content-Type: application/pdf",
    "",
    $certContent,
    "--$certBoundary--"
)
$certUploadBody = [string]::Join("`r`n", $certLines)

$uploadEvidenceResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiary-portal/upload-supporting-doc" -Method Post -Body $certUploadBody `
    -Headers @{ Authorization = "Bearer $beneToken"; "Content-Type" = "multipart/form-data; boundary=$certBoundary" }
Assert-Test "Beneficiary Uploads Evidence Document" ($uploadEvidenceResp.success -eq $true -and $uploadEvidenceResp.data.id -gt 0) "Evidence upload failed"
$evidenceFileId = $uploadEvidenceResp.data.id

# 3.2 Beneficiary submits inheritance claim
$claimPayload = @{
    assetId = $assetId
    beneficiaryId = $beneficiaryId
    claimType = "DEATH_VERIFICATION"
    evidenceFileId = $evidenceFileId
    reason = "Estate owner has passed away. Submitting verified death certificate for inheritance transfer."
} | ConvertTo-Json

$claimResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiary-portal/claims" -Method Post -Body $claimPayload -Headers $beneHeaders -ContentType "application/json"
Assert-Test "Submit Inheritance Access Claim" ($claimResp.success -eq $true -and $claimResp.data.status -eq "PENDING") "Claim submission failed"
$claimId = $claimResp.data.id

# 3.3 Beneficiary verifies claim status in /claims
$myClaimsResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiary-portal/claims" -Method Get -Headers $beneHeaders
Assert-Test "Beneficiary Claims Listed" ($myClaimsResp.success -eq $true -and $myClaimsResp.data.content.Count -ge 1) "Claims list empty"


# ------------------------------------------------------------------------------
# SECTION 4: VERIFIER SECTION WORKFLOW
# ------------------------------------------------------------------------------
Write-Host "`n--- SECTION 4: VERIFIER SECTION WORKFLOW ---" -ForegroundColor Yellow

# 4.1 Ensure Verifier Account Exists (Provisioned via Admin if not present)
$adminLoginPayload = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json
$adminLoginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/admin-login" -Method Post -Body $adminLoginPayload -ContentType "application/json"
$adminToken = $adminLoginResp.data.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }

# Check or Create Verifier
try {
    $createVerifierPayload = @{
        fullName = "Certified Legal Verifier"
        email = $verifierEmail
        password = $verifierPassword
        phoneNumber = "+18005550199"
        notes = "Official legal notary and estate verifier"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/admin/verifiers" -Method Post -Body $createVerifierPayload -Headers $adminHeaders -ContentType "application/json" | Out-Null
} catch {
    # If verifier already exists, that is acceptable
}

# 4.2 Verifier Logs In
$verifierLoginPayload = @{
    email = $verifierEmail
    password = $verifierPassword
} | ConvertTo-Json
$verifierLoginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $verifierLoginPayload -ContentType "application/json"
Assert-Test "Verifier Authentication" ($verifierLoginResp.success -eq $true -and $verifierLoginResp.data.role -eq "VERIFIER") "Verifier login failed"
$verifierToken = $verifierLoginResp.data.token
$verifierHeaders = @{ Authorization = "Bearer $verifierToken" }

# 4.3 Verifier lists inheritance requests
$verifierRequestsResp = Invoke-RestMethod -Uri "$baseUrl/api/verifier/requests" -Method Get -Headers $verifierHeaders
Assert-Test "Verifier Lists Requests" ($verifierRequestsResp.success -eq $true -and $verifierRequestsResp.data.content.Count -ge 1) "Verifier requests list empty"

# 4.4 Verifier retrieves specific claim details
$claimDetailResp = Invoke-RestMethod -Uri "$baseUrl/api/verifier/requests/$claimId" -Method Get -Headers $verifierHeaders
Assert-Test "Verifier Gets Claim Details" ($claimDetailResp.success -eq $true -and $claimDetailResp.data.id -eq $claimId) "Claim details fetch failed"

# 4.5 Verifier downloads evidence document
$evidenceFileBytes = Invoke-RestMethod -Uri "$baseUrl/api/verifier/requests/$claimId/evidence" -Method Get -Headers $verifierHeaders
Assert-Test "Verifier Downloads Evidence" ($evidenceFileBytes.Length -gt 0) "Evidence file content empty"

# 4.6 Verifier marks claim UNDER_REVIEW
$reviewResp = Invoke-RestMethod -Uri "$baseUrl/api/verifier/requests/$claimId/under-review" -Method Patch -Headers $verifierHeaders
Assert-Test "Verifier Marks Under Review" ($reviewResp.success -eq $true -and $reviewResp.data.status -eq "UNDER_REVIEW") "Under review status failed"

# 4.7 Verifier approves claim
$approvePayload = @{
    verificationNotes = "Official legal death certificate validated against government registry. Approved for asset inheritance."
} | ConvertTo-Json
$approveResp = Invoke-RestMethod -Uri "$baseUrl/api/verifier/requests/$claimId/approve" -Method Patch -Body $approvePayload -Headers $verifierHeaders -ContentType "application/json"
Assert-Test "Verifier Approves Claim" ($approveResp.success -eq $true -and $approveResp.data.status -eq "APPROVED") "Claim approval failed"


# ------------------------------------------------------------------------------
# SECTION 5: SECURITYLOCKER & DECRYPTED DOCUMENT ACCESS
# ------------------------------------------------------------------------------
Write-Host "`n--- SECTION 5: SECURITYLOCKER & DECRYPTED DOCUMENT ACCESS ---" -ForegroundColor Yellow

# 5.1 Beneficiary checks Authorized Documents (Unlocked after claim approval)
$authDocsResp = Invoke-RestMethod -Uri "$baseUrl/api/beneficiary-portal/authorized-documents" -Method Get -Headers $beneHeaders
Assert-Test "Authorized Documents Available" ($authDocsResp.success -eq $true -and $authDocsResp.data.Count -ge 1) "No authorized documents found"
$unlockedAsset = $authDocsResp.data[0]
Assert-Test "Asset Unlocked with Decrypted Identifier" ($unlockedAsset.canViewSecret -eq $true -and $unlockedAsset.assetIdentifier -eq "ACC-SWISS-998822-SECRET") "Secret identifier was not decrypted"
Assert-Test "Vault Supporting Files Available" ($unlockedAsset.files.Count -ge 1) "No vault files attached to unlocked asset"
$unlockedFileId = $unlockedAsset.files[0].id

# 5.2 Beneficiary downloads decrypted file from Beneficiary Portal
$downloadedBytes = Invoke-RestMethod -Uri "$baseUrl/api/beneficiary-portal/assets/$assetId/download-file/$unlockedFileId" -Method Get -Headers $beneHeaders
$downloadedText = if ($downloadedBytes -is [string]) { $downloadedBytes } else { [System.Text.Encoding]::UTF8.GetString($downloadedBytes) }
Assert-Test "Beneficiary Downloads Vault Document" ($downloadedText -match "Mock Legal Estate Document Content") "Decrypted file content mismatch"

# 5.3 SecurityLocker Inline Preview endpoint for Owner
$previewResp = Invoke-WebRequest -Uri "$baseUrl/api/assets/$assetId/preview-file/$uploadedDocId" -Method Get -Headers $ownerHeaders -UseBasicParsing
Assert-Test "SecurityLocker Inline Document Preview" ($previewResp.StatusCode -eq 200 -and ("$($previewResp.Headers['Content-Disposition'])" -match "inline")) "Preview endpoint failed or disposition is not inline"


# ------------------------------------------------------------------------------
# SECTION 6: ADMIN SECTION & SECURITY VERIFICATION
# ------------------------------------------------------------------------------
Write-Host "`n--- SECTION 6: ADMIN SECTION & SECURITY VERIFICATION ---" -ForegroundColor Yellow

# 6.1 Security check: Non-admin MUST be rejected from /api/auth/admin-login
try {
    $nonAdminPayload = @{ email = $ownerEmail; password = $ownerNewPassword } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/auth/admin-login" -Method Post -Body $nonAdminPayload -ContentType "application/json"
    Assert-Test "Non-Admin Rejected from Admin Login" $false "Non-admin was unexpectedly allowed into admin portal"
} catch {
    Assert-Test "Non-Admin Rejected from Admin Login" $true "Access denied correctly enforced"
}

# 6.2 Admin Dashboard
$dashResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/dashboard" -Method Get -Headers $adminHeaders
Assert-Test "Admin Dashboard Stats" ($dashResp.success -eq $true -and $dashResp.data.totalUsers -ge 1) "Dashboard metrics failed"

# 6.3 Admin Users List & Details
$adminUsersResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/users" -Method Get -Headers $adminHeaders
Assert-Test "Admin Users List" ($adminUsersResp.success -eq $true -and $adminUsersResp.data.content.Count -ge 1) "Admin users list empty"
$sampleUserId = $adminUsersResp.data.content[0].id

$adminUserDetailResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/users/$sampleUserId" -Method Get -Headers $adminHeaders
Assert-Test "Admin User Details" ($adminUserDetailResp.success -eq $true -and $adminUserDetailResp.data.id -eq $sampleUserId) "Admin user detail failed"

# 6.4 Admin Verifiers List
$adminVerifiersResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/verifiers" -Method Get -Headers $adminHeaders
Assert-Test "Admin Verifiers List" ($adminVerifiersResp.success -eq $true -and $adminVerifiersResp.data.Count -ge 1) "Admin verifiers list empty"

# 6.5 Admin Assets List
$adminAssetsResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/assets" -Method Get -Headers $adminHeaders
Assert-Test "Admin Assets List" ($adminAssetsResp.success -eq $true -and $adminAssetsResp.data.content.Count -ge 1) "Admin assets list empty"

# 6.6 Admin Beneficiaries List
$adminBeneResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/beneficiaries" -Method Get -Headers $adminHeaders
Assert-Test "Admin Beneficiaries List" ($adminBeneResp.success -eq $true -and $adminBeneResp.data.content.Count -ge 1) "Admin beneficiaries list empty"

# 6.7 Admin Emergency Requests List
$adminReqResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/emergency-requests" -Method Get -Headers $adminHeaders
Assert-Test "Admin Emergency Requests List" ($adminReqResp.success -eq $true -and $adminReqResp.data.content.Count -ge 1) "Admin emergency requests list empty"

# 6.8 Admin Audit Logs List
$auditResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/audit-logs" -Method Get -Headers $adminHeaders
Assert-Test "Admin Audit Logs" ($auditResp.success -eq $true -and $auditResp.data.content.Count -ge 1) "Admin audit logs empty"

# 6.9 Admin System Settings
$settingsResp = Invoke-RestMethod -Uri "$baseUrl/api/admin/settings" -Method Get -Headers $adminHeaders
Assert-Test "Admin System Settings" ($settingsResp.success -eq $true -and $settingsResp.data.Count -ge 1) "Admin settings empty"

# Clean up temporary test files
Remove-Item -Path $tempDocPath -Force -ErrorAction SilentlyContinue
Remove-Item -Path $tempCertPath -Force -ErrorAction SilentlyContinue

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "ALL TESTS COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "Total Passed: $passedCount | Total Failed: $failedCount" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
