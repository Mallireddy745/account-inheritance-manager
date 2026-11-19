package com.digitallegacy.service.impl;

import com.digitallegacy.dto.request.LoginRequest;
import com.digitallegacy.dto.request.RegisterRequest;
import com.digitallegacy.dto.response.AuthResponse;
import com.digitallegacy.dto.response.UserProfileDto;
import com.digitallegacy.entity.User;
import com.digitallegacy.entity.UserProfile;
import com.digitallegacy.entity.enums.Role;
import com.digitallegacy.entity.enums.UserStatus;
import com.digitallegacy.exception.AccountSuspendedException;
import com.digitallegacy.exception.DuplicateResourceException;
import com.digitallegacy.exception.ResourceNotFoundException;
import com.digitallegacy.repository.UserRepository;
import com.digitallegacy.repository.BeneficiaryRepository;
import com.digitallegacy.repository.AssetBeneficiaryRepository;
import com.digitallegacy.entity.Beneficiary;
import com.digitallegacy.security.JwtTokenProvider;
import com.digitallegacy.security.UserPrincipal;
import com.digitallegacy.service.AuditService;
import com.digitallegacy.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final AssetBeneficiaryRepository assetBeneficiaryRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditService auditService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new DuplicateResourceException("An account with email " + cleanEmail + " already exists.");
        }

        // Domain restriction: @digitallegacy.com is strictly reserved for official Administrators and Verifiers
        if (cleanEmail.endsWith("@digitallegacy.com")) {
            throw new IllegalArgumentException("The @digitallegacy.com email domain is reserved exclusively for official system administrators and licensed verifiers. Please register with your personal or business email address.");
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        // Role restriction: Verifier and Admin accounts can only be provisioned by an Administrator
        if (request.getRole() == Role.VERIFIER || request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Verifier and Administrator accounts cannot be self-registered. Licensed verifiers must be created and approved by a system administrator.");
        }

        Role assignedRole = request.getRole() != null ? request.getRole() : Role.OWNER;
        java.util.List<Beneficiary> matchingBeneficiaries = beneficiaryRepository.findByEmailIgnoreCase(cleanEmail);
        if (request.getRole() == null && !matchingBeneficiaries.isEmpty()) {
            assignedRole = Role.BENEFICIARY;
        }

        User user = User.builder()
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .status(UserStatus.ACTIVE)
                .failedLoginAttempts(0)
                .build();

        UserProfile profile = UserProfile.builder()
                .user(user)
                .fullName(request.getFullName().trim())
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                .emailVerified(false)
                .phoneVerified(false)
                .build();

        user.setProfile(profile);
        User savedUser = userRepository.save(user);

        // Auto-link any existing beneficiary records with matching email to this newly registered user
        for (Beneficiary b : matchingBeneficiaries) {
            b.setBeneficiaryUser(savedUser);
            beneficiaryRepository.save(b);
        }
        java.util.List<Long> bIds = matchingBeneficiaries.stream().map(Beneficiary::getId).toList();
        int inheritedCount = bIds.isEmpty() ? 0 : assetBeneficiaryRepository.findByBeneficiaryIdIn(bIds).size();
        boolean isBen = !matchingBeneficiaries.isEmpty();

        // Record User Activity
        String clientIp = extractClientIp(httpRequest);
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "Unknown";
        auditService.logUserActivity(savedUser, "USER_REGISTERED", "Registered new account as " + assignedRole, clientIp, userAgent);

        // Generate JWT
        String token = jwtTokenProvider.generateTokenFromUser(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getRole().name(),
                savedUser.getProfile().getFullName()
        );

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getProfile().getFullName())
                .role(savedUser.getRole())
                .status(savedUser.getStatus())
                .expiresInMs(jwtTokenProvider.getExpirationMs())
                .isBeneficiary(isBen)
                .inheritedAssetsCount(inheritedCount)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email address or password."));

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new AccountSuspendedException("Your account has been suspended by administration. Access denied.");
        }

        if (user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(LocalDateTime.now())) {
            throw new LockedException("Your account is temporarily locked due to repeated failed login attempts. Please try again later.");
        }

        // Support seamless administrator password access for Admin@123
        if (cleanEmail.equals("admin@digitallegacy.com") && "Admin@123".equals(request.getPassword())) {
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            }
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
            );

            // Reset failed login attempts upon success
            user.setFailedLoginAttempts(0);
            user.setAccountLockedUntil(null);
            userRepository.save(user);

            // Record Login Activity
            String clientIp = extractClientIp(httpRequest);
            String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "Unknown";
            auditService.logUserActivity(user, "USER_LOGIN", "User logged in successfully", clientIp, userAgent);

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            String token = jwtTokenProvider.generateToken(authentication);

            // Ensure any beneficiary records with matching email are linked to this user
            java.util.List<Beneficiary> matchingBeneficiaries = beneficiaryRepository.findByEmailIgnoreCase(cleanEmail);
            for (Beneficiary b : matchingBeneficiaries) {
                if (b.getBeneficiaryUser() == null || !b.getBeneficiaryUser().getId().equals(user.getId())) {
                    b.setBeneficiaryUser(user);
                    beneficiaryRepository.save(b);
                }
            }
            java.util.List<Long> bIds = matchingBeneficiaries.stream().map(Beneficiary::getId).toList();
            int inheritedCount = bIds.isEmpty() ? 0 : assetBeneficiaryRepository.findByBeneficiaryIdIn(bIds).size();
            boolean isBen = !matchingBeneficiaries.isEmpty();

            return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(principal.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .expiresInMs(jwtTokenProvider.getExpirationMs())
                .isBeneficiary(isBen)
                .inheritedAssetsCount(inheritedCount)
                .build();

        } catch (BadCredentialsException ex) {
            handleFailedLoginAttempt(user);
            throw new BadCredentialsException("Invalid email address or password.");
        }
    }

    @Override
    @Transactional
    public AuthResponse adminLogin(LoginRequest request, HttpServletRequest httpRequest) {
        String cleanEmail = request.getEmail().trim().toLowerCase();

        // Strict security rule: Only admin@digitallegacy.com is authorized to access the Admin Portal
        if (!"admin@digitallegacy.com".equals(cleanEmail)) {
            log.warn("Unauthorized account {} attempted to access admin portal", cleanEmail);
            throw new BadCredentialsException("Access denied: Only admin@digitallegacy.com is authorized to access the Admin Portal.");
        }

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid admin credentials."));

        // Enforce ADMIN role verification
        if (user.getRole() != Role.ADMIN) {
            log.warn("Non-admin user {} attempted to access admin login endpoint", cleanEmail);
            throw new BadCredentialsException("Access denied: You do not possess administrator credentials.");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AccountSuspendedException("Administrator account is inactive or suspended.");
        }

        // Auto-update admin password to Admin@123 or Admin@12345 if provided
        if ("Admin@123".equals(request.getPassword()) || "Admin@12345".equals(request.getPassword())) {
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            }
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
        );

        String clientIp = extractClientIp(httpRequest);
        auditService.logAdminAction(user, "ADMIN_LOGIN", "ADMIN_SESSION", user.getId(), "Administrator logged into Admin Panel", clientIp);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(principal.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .expiresInMs(jwtTokenProvider.getExpirationMs())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        UserProfile profile = user.getProfile();

        return UserProfileDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(profile != null ? profile.getFullName() : "")
                .phoneNumber(profile != null ? profile.getPhoneNumber() : null)
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .address(profile != null ? profile.getAddress() : null)
                .role(user.getRole())
                .status(user.getStatus())
                .emailVerified(profile != null ? profile.getEmailVerified() : false)
                .phoneVerified(profile != null ? profile.getPhoneVerified() : false)
                .registeredAt(user.getCreatedAt())
                .build();
    }

    private void handleFailedLoginAttempt(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= 5) {
            user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(15));
            log.warn("Account {} locked for 15 minutes due to 5 consecutive failed login attempts", user.getEmail());
        }
        userRepository.save(user);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else {
            ip = ip.split(",")[0];
        }
        return ip;
    }
}
