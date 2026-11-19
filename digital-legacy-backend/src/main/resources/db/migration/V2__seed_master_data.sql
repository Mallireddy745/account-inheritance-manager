-- =============================================================================
-- Migration V2: Seed Essential Master Data
-- 1. Supported Digital Asset Categories
-- 2. Initial System Settings & Limits
-- 3. Provisioned Platform Administrator & Administrator Permissions
-- =============================================================================

-- 1. Seed Asset Categories
INSERT INTO asset_categories (name, code, description, icon, is_active) VALUES
('Social Media Accounts', 'SOCIAL_MEDIA', 'Facebook, Instagram, LinkedIn, X/Twitter, YouTube accounts', 'bi-share-fill', TRUE),
('Email Accounts', 'EMAIL', 'Google, Outlook, Yahoo, and private custom email servers', 'bi-envelope-at-fill', TRUE),
('Financial & Banking References', 'FINANCIAL', 'Bank accounts, investment brokerages, and insurance policy references', 'bi-bank2', TRUE),
('Cryptocurrency Wallets', 'CRYPTO', 'Hardware wallets, seed phrase backups, and exchange references', 'bi-currency-bitcoin', TRUE),
('Domain Names', 'DOMAIN', 'Registrars, DNS managers, and domain name portfolios', 'bi-globe2', TRUE),
('Websites & Servers', 'WEBSITE', 'Web hosting accounts, VPS servers, and cloud console logins', 'bi-hdd-network-fill', TRUE),
('Cloud Storage & Backups', 'CLOUD_STORAGE', 'Google Drive, Dropbox, OneDrive, iCloud storage spaces', 'bi-cloud-check-fill', TRUE),
('Personal & Legal Documents', 'PERSONAL_DOCUMENTS', 'Wills, deeds, birth certificates, property titles, contracts', 'bi-file-earmark-lock2-fill', TRUE),
('Photos & Media Vaults', 'MEDIA', 'Family photo archives, video libraries, and digital collections', 'bi-camera-reels-fill', TRUE),
('Business & Intellectual Property', 'BUSINESS', 'Patents, copyright certificates, company ownership documentation', 'bi-briefcase-fill', TRUE),
('Other Digital Assets', 'OTHER', 'Miscellaneous digital assets and private custom instructions', 'bi-box-seam-fill', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Seed Default System Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('PLATFORM_NAME', 'Digital Legacy Manager', 'Official platform display name'),
('MAX_UPLOAD_SIZE_MB', '25', 'Maximum permissible file upload size per supporting document'),
('ALLOWED_FILE_EXTENSIONS', 'pdf,jpg,jpeg,png,doc,docx', 'Permitted file upload MIME extension list'),
('EMERGENCY_WAITING_PERIOD_DAYS', '7', 'Default cooldown waiting period for emergency access verification'),
('MAINTENANCE_MODE', 'false', 'Platform maintenance flag')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- 3. Seed Default System Administrator
-- Initial Credentials: admin@digitallegacy.com / Admin@12345
-- Password encrypted via Spring Security BCryptPasswordEncoder (strength 12)
INSERT INTO users (id, email, password, role, status, failed_login_attempts) VALUES
(1, 'admin@digitallegacy.com', '$2a$12$VdCuu9sHve576X7u0CdpkeyHmTkVZjWOyUBoaHtBCqYZCRO6DmtJ6', 'ADMIN', 'ACTIVE', 0)
ON DUPLICATE KEY UPDATE role='ADMIN';

-- Seed Admin Profile
INSERT INTO user_profiles (user_id, full_name, phone_number, email_verified, phone_verified) VALUES
(1, 'Master Administrator', '+1-800-555-0199', TRUE, TRUE)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- Seed Administrator Permissions
INSERT INTO administrator_permissions (admin_id, permission_name) VALUES
(1, 'SUPER_ADMIN'),
(1, 'MANAGE_USERS'),
(1, 'MANAGE_ASSETS'),
(1, 'MANAGE_BENEFICIARIES'),
(1, 'REVIEW_EMERGENCY_REQUESTS'),
(1, 'VERIFY_IDENTITIES'),
(1, 'VIEW_AUDIT_LOGS'),
(1, 'SYSTEM_SETTINGS')
ON DUPLICATE KEY UPDATE permission_name=VALUES(permission_name);
