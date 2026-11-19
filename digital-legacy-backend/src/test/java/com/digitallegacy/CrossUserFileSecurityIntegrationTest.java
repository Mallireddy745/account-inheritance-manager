package com.digitallegacy;

import com.digitallegacy.dto.request.AssetRequestDto;
import com.digitallegacy.dto.request.LoginRequest;
import com.digitallegacy.dto.request.RegisterRequest;
import com.digitallegacy.entity.AssetCategory;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
public class CrossUserFileSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssetCategoryRepository categoryRepository;

    private String userAToken;
    private String userBToken;
    private String adminToken;
    private Long userAAssetId;
    private Long userAFileId;
    private byte[] rawFileBytes;

    @BeforeEach
    void setup() throws Exception {
        userRepository.findByEmail("victim.user@example.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("attacker.user@example.com").ifPresent(userRepository::delete);

        // 1. Register User A (Victim)
        RegisterRequest userAReq = RegisterRequest.builder()
                .fullName("Victim User A")
                .email("victim.user@example.com")
                .password("Password@123")
                .confirmPassword("Password@123")
                .termsConsent(true)
                .build();

        MvcResult userARes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userAReq)))
                .andExpect(status().isCreated())
                .andReturn();
        this.userAToken = objectMapper.readTree(userARes.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // 2. Register User B (Attacker)
        RegisterRequest userBReq = RegisterRequest.builder()
                .fullName("Attacker User B")
                .email("attacker.user@example.com")
                .password("Password@123")
                .confirmPassword("Password@123")
                .termsConsent(true)
                .build();

        MvcResult userBRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userBReq)))
                .andExpect(status().isCreated())
                .andReturn();
        this.userBToken = objectMapper.readTree(userBRes.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // 3. Login Admin
        LoginRequest adminLogin = LoginRequest.builder()
                .email("admin@digitallegacy.com")
                .password("Admin@12345")
                .build();

        MvcResult adminRes = mockMvc.perform(post("/api/auth/admin-login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        this.adminToken = objectMapper.readTree(adminRes.getResponse().getContentAsString())
                .get("data").get("token").asText();

        // 4. User A creates an asset
        AssetCategory cat = categoryRepository.findAll().get(0);
        AssetRequestDto assetDto = AssetRequestDto.builder()
                .name("Victim Secret Safe")
                .categoryId(cat.getId())
                .platformName("Private Safe")
                .assetIdentifier("SAFE-CODE-778899")
                .description("Private family trust documents")
                .status(com.digitallegacy.entity.enums.AssetStatus.ACTIVE)
                .build();

        MvcResult assetRes = mockMvc.perform(post("/api/assets/simple")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assetDto)))
                .andExpect(status().isCreated())
                .andReturn();
        this.userAAssetId = objectMapper.readTree(assetRes.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        // 5. User A uploads a sensitive document
        this.rawFileBytes = "CLASSIFIED_ESTATE_INSTRUCTIONS_FOR_FAMILY_ONLY".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "last_will_testament.txt", "text/plain", rawFileBytes);

        MvcResult fileRes = mockMvc.perform(multipart("/api/assets/" + userAAssetId + "/files")
                        .file(file)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isEncrypted").value(true))
                .andReturn();

        this.userAFileId = objectMapper.readTree(fileRes.getResponse().getContentAsString())
                .get("data").get("id").asLong();
    }

    @Test
    void testOwnerCanDownloadAndDecryptFile() throws Exception {
        MvcResult downloadRes = mockMvc.perform(get("/api/assets/" + userAAssetId + "/download-file/" + userAFileId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andReturn();

        byte[] downloadedBytes = downloadRes.getResponse().getContentAsByteArray();
        assertArrayEquals(rawFileBytes, downloadedBytes);
    }

    @Test
    void testAttackerDeniedAccessToVictimFile() throws Exception {
        // User B tries to download User A's file via user endpoint -> 404 Not Found (Zero-Trust asset scoping prevents IDOR)
        mockMvc.perform(get("/api/assets/" + userAAssetId + "/download-file/" + userAFileId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testAdminCanInspectAndDownloadVictimFile() throws Exception {
        // Admin downloads User A's file via admin endpoint -> 200 OK & decrypted
        MvcResult adminDownloadRes = mockMvc.perform(get("/api/admin/assets/" + userAAssetId + "/download-file/" + userAFileId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        byte[] downloadedBytes = adminDownloadRes.getResponse().getContentAsByteArray();
        assertArrayEquals(rawFileBytes, downloadedBytes);
    }

    @Test
    void testAnonymousDeniedAccess() throws Exception {
        // Anonymous request with no token -> 401 Unauthorized
        mockMvc.perform(get("/api/assets/" + userAAssetId + "/download-file/" + userAFileId))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/assets/" + userAAssetId + "/download-file/" + userAFileId))
                .andExpect(status().isUnauthorized());
    }
}
