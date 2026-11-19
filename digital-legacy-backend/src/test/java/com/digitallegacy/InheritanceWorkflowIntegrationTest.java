package com.digitallegacy;

import com.digitallegacy.dto.request.*;
import com.digitallegacy.dto.response.ApiResponse;
import com.digitallegacy.dto.response.BeneficiaryResponseDto;
import com.digitallegacy.dto.response.EmergencyRequestDto;
import com.digitallegacy.entity.AssetCategory;
import com.digitallegacy.entity.enums.ClaimType;
import com.digitallegacy.entity.enums.EmergencyRequestStatus;
import com.digitallegacy.entity.enums.Role;
import com.digitallegacy.repository.AssetCategoryRepository;
import com.digitallegacy.repository.BeneficiaryRepository;
import com.digitallegacy.repository.EmergencyRequestRepository;
import com.digitallegacy.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class InheritanceWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;

    @Autowired
    private EmergencyRequestRepository emergencyRequestRepository;

    @Autowired
    private AssetCategoryRepository categoryRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @BeforeEach
    void cleanup() {
        // Clean up test emails
        userRepository.findByEmail("ravi.owner@example.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("priya.heir@example.com").ifPresent(userRepository::delete);

        // Ensure verifier has known test credentials
        userRepository.findByEmail("verifier@digitallegacy.com").ifPresent(v -> {
            v.setPassword(passwordEncoder.encode("Verifier@12345"));
            v.setStatus(com.digitallegacy.entity.enums.UserStatus.ACTIVE);
            v.setAccountLockedUntil(null);
            v.setFailedLoginAttempts(0);
            userRepository.save(v);
        });
    }

    @Test
    void testCompleteInheritanceAccessLifecycleWithoutOwnerPassword() throws Exception {
        // -------------------------------------------------------------
        // Step 1: Ravi registers as Estate Owner
        // -------------------------------------------------------------
        RegisterRequest raviRegister = RegisterRequest.builder()
                .fullName("Ravi Sharma")
                .email("ravi.owner@example.com")
                .password("Ravi@12345")
                .confirmPassword("Ravi@12345")
                .termsConsent(true)
                .role(Role.OWNER)
                .build();

        MvcResult raviRegRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(raviRegister)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode raviJson = objectMapper.readTree(raviRegRes.getResponse().getContentAsString());
        String raviToken = raviJson.get("data").get("token").asText();
        assertNotNull(raviToken);

        // -------------------------------------------------------------
        // Step 2: Ravi creates a digital asset
        // -------------------------------------------------------------
        AssetCategory cat = categoryRepository.findAll().get(0);
        AssetRequestDto assetDto = AssetRequestDto.builder()
                .name("Ravi Offshore Investment Vault")
                .categoryId(cat.getId())
                .platformName("Swiss Banking Corp")
                .assetIdentifier("CH-SECRET-SWISS-VAULT-9988")
                .description("Offshore family liquidity trust")
                .transferInstructions("Release to daughter Priya upon approved legal death verification")
                .build();

        MvcResult assetRes = mockMvc.perform(post("/api/assets/simple")
                        .header("Authorization", "Bearer " + raviToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assetDto)))
                .andExpect(status().isCreated())
                .andReturn();

        Long assetId = objectMapper.readTree(assetRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        // -------------------------------------------------------------
        // Step 3: Ravi adds Priya as a beneficiary and assigns the asset
        // -------------------------------------------------------------
        BeneficiaryRequestDto beneDto = BeneficiaryRequestDto.builder()
                .fullName("Priya Sharma")
                .email("priya.heir@example.com")
                .phoneNumber("+91-9876543210")
                .relationship("Daughter")
                .address("New Delhi, India")
                .assignedAssetIds(List.of(assetId))
                .permissionType("VIEW")
                .allocationPercentage(BigDecimal.valueOf(100.0))
                .build();

        MvcResult beneRes = mockMvc.perform(post("/api/beneficiaries")
                        .header("Authorization", "Bearer " + raviToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(beneDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.invitationStatus").value("PENDING"))
                .andReturn();

        Long beneficiaryRecordId = objectMapper.readTree(beneRes.getResponse().getContentAsString()).get("data").get("id").asLong();
        assertTrue(beneficiaryRecordId > 0);

        // -------------------------------------------------------------
        // Step 4: Priya registers with her OWN email and password (Never uses Ravi's password)
        // -------------------------------------------------------------
        RegisterRequest priyaRegister = RegisterRequest.builder()
                .fullName("Priya Sharma")
                .email("priya.heir@example.com")
                .password("Priya@12345")
                .confirmPassword("Priya@12345")
                .termsConsent(true)
                .role(Role.BENEFICIARY)
                .build();

        MvcResult priyaRegRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(priyaRegister)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.role").value("BENEFICIARY"))
                .andReturn();

        String priyaToken = objectMapper.readTree(priyaRegRes.getResponse().getContentAsString()).get("data").get("token").asText();
        assertNotNull(priyaToken);

        // -------------------------------------------------------------
        // Step 5: Priya views invitations and accepts Ravi's nomination
        // -------------------------------------------------------------
        mockMvc.perform(get("/api/beneficiary-portal/invitations")
                        .header("Authorization", "Bearer " + priyaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].ownerEmail").value("ravi.owner@example.com"))
                .andExpect(jsonPath("$.data[0].relationship").value("Daughter"));

        mockMvc.perform(post("/api/beneficiary-portal/invitations/" + beneficiaryRecordId + "/accept")
                        .header("Authorization", "Bearer " + priyaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // -------------------------------------------------------------
        // Step 6: Prior to claim approval, asset secret is LOCKED
        // -------------------------------------------------------------
        MvcResult preClaimAssets = mockMvc.perform(get("/api/beneficiary-portal/assets")
                        .header("Authorization", "Bearer " + priyaToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode preAssetsJson = objectMapper.readTree(preClaimAssets.getResponse().getContentAsString()).get("data");
        assertEquals(1, preAssetsJson.size());
        assertFalse(preAssetsJson.get(0).get("canViewSecret").asBoolean());
        assertNotEquals("CH-SECRET-SWISS-VAULT-9988", preAssetsJson.get(0).get("assetIdentifier").asText());

        // -------------------------------------------------------------
        // Step 7: Priya submits an inheritance access request (Death verification)
        // -------------------------------------------------------------
        EmergencyRequestCreateDto claimDto = EmergencyRequestCreateDto.builder()
                .beneficiaryId(beneficiaryRecordId)
                .assetId(assetId)
                .claimType(ClaimType.DEATH_VERIFICATION)
                .reason("Estate owner Ravi Sharma has passed away; submitting official death registry certificate.")
                .build();

        MvcResult claimRes = mockMvc.perform(post("/api/beneficiary-portal/claims")
                        .header("Authorization", "Bearer " + priyaToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(claimDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.claimType").value("DEATH_VERIFICATION"))
                .andReturn();

        Long claimId = objectMapper.readTree(claimRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        // -------------------------------------------------------------
        // Step 8: Verifier logs in and reviews the request
        // -------------------------------------------------------------
        LoginRequest verifierLogin = new LoginRequest("verifier@digitallegacy.com", "Verifier@12345");
        MvcResult verifierAuth = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifierLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("VERIFIER"))
                .andReturn();

        String verifierToken = objectMapper.readTree(verifierAuth.getResponse().getContentAsString()).get("data").get("token").asText();

        // Mark UNDER_REVIEW
        mockMvc.perform(patch("/api/verifier/requests/" + claimId + "/under-review")
                        .header("Authorization", "Bearer " + verifierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("UNDER_REVIEW"));

        // Verifier approves the claim
        EmergencyRequestReviewDto reviewDto = EmergencyRequestReviewDto.builder()
                .adminNotes("Official death certificate and identity verified against national records.")
                .build();

        mockMvc.perform(patch("/api/verifier/requests/" + claimId + "/approve")
                        .header("Authorization", "Bearer " + verifierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        // -------------------------------------------------------------
        // Step 9: After approval, Priya can now view the unlocked asset and credentials!
        // -------------------------------------------------------------
        MvcResult postClaimAssets = mockMvc.perform(get("/api/beneficiary-portal/assets")
                        .header("Authorization", "Bearer " + priyaToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode postAssetsJson = objectMapper.readTree(postClaimAssets.getResponse().getContentAsString()).get("data");
        assertEquals(1, postAssetsJson.size());
        assertTrue(postAssetsJson.get(0).get("canViewSecret").asBoolean());
        assertEquals("CH-SECRET-SWISS-VAULT-9988", postAssetsJson.get(0).get("assetIdentifier").asText());

        // Priya can check Authorized Documents endpoint
        mockMvc.perform(get("/api/beneficiary-portal/authorized-documents")
                        .header("Authorization", "Bearer " + priyaToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(assetId))
                .andExpect(jsonPath("$.data[0].assetIdentifier").value("CH-SECRET-SWISS-VAULT-9988"));
    }

    @Test
    void testVerifierAdminProvisioningAndDomainRestrictions() throws Exception {
        userRepository.findByEmail("officer1@digitallegacy.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("impostor@digitallegacy.com").ifPresent(userRepository::delete);

        // 1. Attempting public registration with @digitallegacy.com domain must be rejected
        RegisterRequest domainViolation = RegisterRequest.builder()
                .fullName("Impostor User")
                .email("impostor@digitallegacy.com")
                .password("User@12345")
                .confirmPassword("User@12345")
                .role(Role.OWNER)
                .termsConsent(true)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(domainViolation)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("@digitallegacy.com email domain is reserved")));

        // 2. Attempting public registration as a VERIFIER must be rejected
        RegisterRequest roleViolation = RegisterRequest.builder()
                .fullName("Self Declared Verifier")
                .email("someone@gmail.com")
                .password("User@12345")
                .confirmPassword("User@12345")
                .role(Role.VERIFIER)
                .termsConsent(true)
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(roleViolation)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Verifier and Administrator accounts cannot be self-registered")));

        // 3. Admin logs in
        LoginRequest adminLogin = new LoginRequest("admin@digitallegacy.com", "Admin@12345");
        MvcResult adminAuth = mockMvc.perform(post("/api/auth/admin-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String adminToken = objectMapper.readTree(adminAuth.getResponse().getContentAsString()).get("data").get("token").asText();

        // 4. Admin creates and approves an official Verifier with @digitallegacy.com email
        com.digitallegacy.dto.request.CreateVerifierRequestDto verifierReq = com.digitallegacy.dto.request.CreateVerifierRequestDto.builder()
                .fullName("Officer Sarah Jenkins")
                .email("officer1@digitallegacy.com")
                .password("Officer@12345")
                .phoneNumber("+1-555-0188")
                .notes("Official certified succession verifier")
                .build();

        mockMvc.perform(post("/api/admin/verifiers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifierReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value("officer1@digitallegacy.com"))
                .andExpect(jsonPath("$.data.role").value("VERIFIER"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));

        // 5. Newly created Verifier logs in with newly assigned credentials
        LoginRequest verifierLogin = new LoginRequest("officer1@digitallegacy.com", "Officer@12345");
        MvcResult verifierAuth = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifierLogin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("VERIFIER"))
                .andReturn();

        String verifierToken = objectMapper.readTree(verifierAuth.getResponse().getContentAsString()).get("data").get("token").asText();

        // 6. Verifier accesses the Verifier Portal endpoints
        mockMvc.perform(get("/api/verifier/requests")
                        .header("Authorization", "Bearer " + verifierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
