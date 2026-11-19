package com.digitallegacy;

import com.digitallegacy.dto.request.AssetRequestDto;
import com.digitallegacy.dto.request.BeneficiaryRequestDto;
import com.digitallegacy.dto.request.PermissionRequestDto;
import com.digitallegacy.dto.request.RegisterRequest;
import com.digitallegacy.entity.AssetCategory;
import com.digitallegacy.entity.enums.PermissionType;
import com.digitallegacy.repository.AssetCategoryRepository;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class UserPanelIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssetCategoryRepository categoryRepository;

    private String userToken;
    private Long testCategoryId;

    @BeforeEach
    void setup() throws Exception {
        userRepository.findByEmail("alice.owner@example.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("bob.intruder@example.com").ifPresent(userRepository::delete);

        // Register user Alice
        RegisterRequest registerReq = RegisterRequest.builder()
                .fullName("Alice Owner")
                .email("alice.owner@example.com")
                .password("Password@123")
                .confirmPassword("Password@123")
                .termsConsent(true)
                .build();

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        this.userToken = jsonNode.get("data").get("token").asText();

        AssetCategory category = categoryRepository.findByCode("FINANCIAL")
                .orElseGet(() -> categoryRepository.findAll().get(0));
        this.testCategoryId = category.getId();
    }

    @Test
    void testEndToEndUserPanelFlow() throws Exception {
        // 1. Fetch Categories
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        // 2. Add Beneficiary (Bob)
        BeneficiaryRequestDto benReq = BeneficiaryRequestDto.builder()
                .fullName("Bob Beneficiary")
                .email("bob.ben@example.com")
                .phoneNumber("+1-555-0188")
                .relationship("Brother")
                .address("123 Maple St")
                .build();

        MvcResult benResult = mockMvc.perform(post("/api/beneficiaries")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(benReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Bob Beneficiary"))
                .andReturn();

        JsonNode benJson = objectMapper.readTree(benResult.getResponse().getContentAsString());
        Long beneficiaryId = benJson.get("data").get("id").asLong();

        // 3. Create Digital Asset (Primary Savings Account)
        AssetRequestDto assetReq = AssetRequestDto.builder()
                .name("Chase Primary Savings")
                .categoryId(testCategoryId)
                .platformName("JPMorgan Chase")
                .assetIdentifier("ACC-987654321")
                .description("Family emergency reserve account")
                .transferInstructions("Contact attorney with death certificate for legal transfer")
                .beneficiaryIds(Collections.singletonList(beneficiaryId))
                .allocationPercentage(new BigDecimal("100.00"))
                .build();

        MvcResult assetResult = mockMvc.perform(post("/api/assets/simple")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assetReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Chase Primary Savings"))
                .andExpect(jsonPath("$.data.beneficiaries").isArray())
                .andReturn();

        JsonNode assetJson = objectMapper.readTree(assetResult.getResponse().getContentAsString());
        Long assetId = assetJson.get("data").get("id").asLong();

        // 4. Grant Emergency Access Permission
        PermissionRequestDto permReq = PermissionRequestDto.builder()
                .assetId(assetId)
                .beneficiaryId(beneficiaryId)
                .permissionType(PermissionType.EMERGENCY_ACCESS)
                .accessCondition("Effective only upon medical incapacitation evidence review")
                .build();

        MvcResult permResult = mockMvc.perform(post("/api/permissions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(permReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.permissionType").value("EMERGENCY_ACCESS"))
                .andReturn();

        JsonNode permJson = objectMapper.readTree(permResult.getResponse().getContentAsString());
        Long permissionId = permJson.get("data").get("id").asLong();

        // 5. Query User Dashboard (Assert real-time MySQL metrics)
        mockMvc.perform(get("/api/user/dashboard")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalAssets").value(1))
                .andExpect(jsonPath("$.data.totalBeneficiaries").value(1))
                .andExpect(jsonPath("$.data.activePermissions").value(3))
                .andExpect(jsonPath("$.data.recentActivities").isArray());

        // 6. Test IDOR Zero-Trust Protection: User Bob attempts to access Alice's asset
        RegisterRequest intruderReq = RegisterRequest.builder()
                .fullName("Bob Intruder")
                .email("bob.intruder@example.com")
                .password("Password@123")
                .confirmPassword("Password@123")
                .termsConsent(true)
                .build();

        MvcResult intruderRegResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(intruderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String intruderToken = objectMapper.readTree(intruderRegResult.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // Bob tries to access Alice's asset ID -> MUST return 404 Not Found (Zero-Trust scoping)
        mockMvc.perform(get("/api/assets/" + assetId)
                        .header("Authorization", "Bearer " + intruderToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        // 7. Revoke Permission
        mockMvc.perform(patch("/api/permissions/" + permissionId + "/revoke")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRevoked").value(true));
    }
}
