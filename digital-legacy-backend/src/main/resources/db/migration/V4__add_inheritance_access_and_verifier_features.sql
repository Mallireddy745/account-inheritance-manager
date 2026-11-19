-- =============================================================================
-- Migration V4: Beneficiary Inheritance Access, Invitation Workflow, and Verifier Panel
-- =============================================================================

-- 1. Add invitation_status and invitation_token to beneficiaries table
ALTER TABLE beneficiaries 
    ADD COLUMN invitation_status ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING' AFTER verification_status,
    ADD COLUMN invitation_token VARCHAR(100) NULL AFTER invitation_status;

-- 2. Update existing beneficiaries to ACCEPTED if they already have an associated user account
UPDATE beneficiaries SET invitation_status = 'ACCEPTED' WHERE beneficiary_user_id IS NOT NULL;

-- 3. Modify emergency_requests to:
--    a) Allow nullable asset_id (when request is filed at owner estate level)
--    b) Add ADDITIONAL_INFORMATION_REQUIRED to status ENUM
--    c) Add claim_type (DEATH_VERIFICATION vs INCAPACITY_VERIFICATION)
--    d) Add verification_notes
ALTER TABLE emergency_requests 
    MODIFY COLUMN status ENUM('PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    MODIFY COLUMN asset_id BIGINT NULL;

ALTER TABLE emergency_requests 
    ADD COLUMN claim_type ENUM('DEATH_VERIFICATION', 'INCAPACITY_VERIFICATION') NOT NULL DEFAULT 'DEATH_VERIFICATION' AFTER asset_id,
    ADD COLUMN verification_notes TEXT NULL AFTER admin_notes;

-- 4. Seed Certified Verifier User (verifier@digitallegacy.com / Verifier@12345)
INSERT INTO users (id, email, password, role, status, failed_login_attempts) VALUES
(60, 'verifier@digitallegacy.com', '$2a$12$JwadYp4SYxJlUOhA30Jg8etXgDFI5KuW5wzc3a1/B1MWDMpw77IIi', 'VERIFIER', 'ACTIVE', 0)
ON DUPLICATE KEY UPDATE role='VERIFIER', status='ACTIVE';

INSERT INTO user_profiles (user_id, full_name, phone_number, email_verified, phone_verified) VALUES
(60, 'Certified Estate Verifier', '+1-555-0199', TRUE, TRUE)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);
