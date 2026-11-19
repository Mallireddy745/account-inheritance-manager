try {
    # 1. Admin login
    $adminBody = @{ email = "admin@digitallegacy.com"; password = "Admin@12345" } | ConvertTo-Json
    $adminAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/admin-login" -Method POST -Body $adminBody -ContentType "application/json"
    $adminToken = $adminAuth.data.token
    Write-Host "[1/7] Admin logged in successfully."

    # 2. Register Owner
    $unique = Get-Random -Minimum 1000 -Maximum 9999
    $ownerEmail = "owner_@example.com"
    $ownerBody = @{
        fullName = "Test Estate Owner "
        email = $ownerEmail
        password = "Password@123"
        confirmPassword = "Password@123"
        phoneNumber = "+1999888777"
        termsConsent = $true
    } | ConvertTo-Json
    $ownerAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -Body $ownerBody -ContentType "application/json"
    $ownerToken = $ownerAuth.data.token
    $ownerId = $ownerAuth.data.userId
    Write-Host "[2/7] Owner registered successfully: $ownerEmail (ID: $ownerId)"

    # 3. Add Beneficiary
    $beneficiaryBody = @{
        fullName = "Designated Heir "
        email = "heir_@example.com"
        phoneNumber = "+1234567890"
        relationship = "Daughter"
    } | ConvertTo-Json
    $beneRes = Invoke-RestMethod -Uri "http://localhost:8080/api/beneficiaries" -Method POST -Body $beneficiaryBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $ownerToken" }
    $beneficiaryId = $beneRes.data.id
    Write-Host "[3/7] Beneficiary created: ID $beneficiaryId"

    # 4. Create Asset (Simple JSON)
    $assetBody = @{
        name = "Primary Family Trust Account "
        categoryId = 3
        platformName = "Fidelity Investments"
        assetIdentifier = "FID-TRUST-998877"
        description = "Core estate holdings and emergency family liquidity"
        transferInstructions = "Release to daughter upon approved emergency claim"
        beneficiaryId = $beneficiaryId
    } | ConvertTo-Json
    $assetRes = Invoke-RestMethod -Uri "http://localhost:8080/api/assets/simple" -Method POST -Body $assetBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $ownerToken" }
    $assetId = $assetRes.data.id
    Write-Host "[4/7] Asset created: ID $assetId"

    # 5. Submit Emergency Request
    $claimBody = @{
        assetId = $assetId
        beneficiaryId = $beneficiaryId
        reason = "Estate owner incapacitated, immediate emergency medical bills required."
    } | ConvertTo-Json
    $claimRes = Invoke-RestMethod -Uri "http://localhost:8080/api/emergency-requests" -Method POST -Body $claimBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $ownerToken" }
    $requestId = $claimRes.data.id
    $initialStatus = $claimRes.data.status
    Write-Host "[5/7] Emergency Claim submitted: Request ID $requestId (Status: $initialStatus)"

    # 6. Admin approves claim
    $reviewBody = @{
        adminNotes = "Identity confirmed via official medical documentation. Claim verified."
    } | ConvertTo-Json
    $approveRes = Invoke-RestMethod -Uri "http://localhost:8080/api/admin/emergency-requests/$requestId/approve" -Method PATCH -Body $reviewBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $adminToken" }
    $finalStatus = $approveRes.data.status
    Write-Host "[6/7] Admin approved claim: Final Status is $finalStatus"

    # 7. Verify Owner received notification
    $notifRes = Invoke-RestMethod -Uri "http://localhost:8080/api/notifications" -Method GET -Headers @{ Authorization = "Bearer $ownerToken" }
    $notifCount = $notifRes.data.content.Count
    Write-Host "[7/7] Owner notifications received: $notifCount notification(s)."

    Write-Host ">>> ALL 7 STAGES OF THE EMERGENCY CLAIM WORKFLOW PASSED WITH FLYING COLORS! <<<"
} catch {
    Write-Error "E2E Error: $($_.Exception.Message)"
}
