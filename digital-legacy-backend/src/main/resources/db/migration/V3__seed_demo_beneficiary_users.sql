-- =============================================================================
-- Migration V3: Seed Dedicated Demo Beneficiary User Accounts
-- 1. Seed Sarah Doe (sarah.doe@example.com / User@12345)
-- 2. Seed Michael Doe (michael.doe@example.com / User@12345)
-- 3. Link beneficiary records to their dedicated user accounts
-- 4. Assign digital assets and permissions to beneficiaries
-- =============================================================================

-- 1. Insert Beneficiary User Sarah Doe
INSERT INTO users (id, email, password, role, status, failed_login_attempts) VALUES
(50, 'sarah.doe@example.com', '$2a$12$PjVMUSVXdaxBLvx/e3.Nx.KH01mMrAt5ecz8l1jaVG..4kyZ6rfTu', 'BENEFICIARY', 'ACTIVE', 0)
ON DUPLICATE KEY UPDATE status='ACTIVE';

INSERT INTO user_profiles (user_id, full_name, phone_number, email_verified, phone_verified) VALUES
(50, 'Sarah Doe', '+1-555-0144', TRUE, TRUE)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 2. Insert Beneficiary User Michael Doe
INSERT INTO users (id, email, password, role, status, failed_login_attempts) VALUES
(51, 'michael.doe@example.com', '$2a$12$PjVMUSVXdaxBLvx/e3.Nx.KH01mMrAt5ecz8l1jaVG..4kyZ6rfTu', 'BENEFICIARY', 'ACTIVE', 0)
ON DUPLICATE KEY UPDATE status='ACTIVE';

INSERT INTO user_profiles (user_id, full_name, phone_number, email_verified, phone_verified) VALUES
(51, 'Michael Doe', '+1-555-0155', TRUE, TRUE)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 3. Link existing beneficiaries to their user accounts
UPDATE beneficiaries SET beneficiary_user_id = 50, verification_status = 'VERIFIED' WHERE email = 'sarah.doe@example.com';
UPDATE beneficiaries SET beneficiary_user_id = 51, verification_status = 'VERIFIED' WHERE email = 'michael.doe@example.com';

-- 4. Assign digital assets to beneficiaries if assets exist
INSERT INTO asset_beneficiaries (asset_id, beneficiary_id, allocation_percentage, notes)
SELECT da.id, b.id, 50.00, 'Designated heir'
FROM digital_assets da, beneficiaries b
WHERE da.name LIKE '%Vanguard%' AND b.email = 'sarah.doe@example.com'
AND NOT EXISTS (SELECT 1 FROM asset_beneficiaries ab WHERE ab.asset_id = da.id AND ab.beneficiary_id = b.id);

INSERT INTO asset_beneficiaries (asset_id, beneficiary_id, allocation_percentage, notes)
SELECT da.id, b.id, 100.00, 'Swiss trust designated beneficiary'
FROM digital_assets da, beneficiaries b
WHERE da.name LIKE '%Swiss%' AND b.email = 'sarah.doe@example.com'
AND NOT EXISTS (SELECT 1 FROM asset_beneficiaries ab WHERE ab.asset_id = da.id AND ab.beneficiary_id = b.id);

INSERT INTO asset_beneficiaries (asset_id, beneficiary_id, allocation_percentage, notes)
SELECT da.id, b.id, 100.00, 'Family memories custodian'
FROM digital_assets da, beneficiaries b
WHERE da.name LIKE '%Photo%' AND b.email = 'michael.doe@example.com'
AND NOT EXISTS (SELECT 1 FROM asset_beneficiaries ab WHERE ab.asset_id = da.id AND ab.beneficiary_id = b.id);
