package com.digitallegacy.util;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Slf4j
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;

    @Value("${app.encryption.aes-key:636173686c6567616379736563757265}")
    private String configuredKey;

    private byte[] keyBytes;

    @PostConstruct
    public void init() {
        byte[] raw = configuredKey.getBytes(StandardCharsets.UTF_8);
        this.keyBytes = Arrays.copyOf(raw, 32); // Ensure exactly 256 bits (32 bytes)
    }

    public byte[] encrypt(byte[] plaintext) throws Exception {
        byte[] iv = new byte[IV_LENGTH_BYTE];
        SecureRandom random = new SecureRandom();
        random.nextBytes(iv);

        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
        GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, parameterSpec);

        byte[] cipherText = cipher.doFinal(plaintext);

        ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
        byteBuffer.put(iv);
        byteBuffer.put(cipherText);
        return byteBuffer.array();
    }

    public byte[] decrypt(byte[] cipherMessage) throws Exception {
        ByteBuffer byteBuffer = ByteBuffer.wrap(cipherMessage);
        byte[] iv = new byte[IV_LENGTH_BYTE];
        byteBuffer.get(iv);

        byte[] cipherText = new byte[byteBuffer.remaining()];
        byteBuffer.get(cipherText);

        SecretKeySpec keySpec = new SecretKeySpec(keyBytes, "AES");
        GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, keySpec, parameterSpec);

        return cipher.doFinal(cipherText);
    }

    public String encryptString(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] encrypted = encrypt(plaintext.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception ex) {
            log.error("Encryption failed for string: {}", ex.getMessage());
            throw new RuntimeException("Failed to encrypt sensitive data", ex);
        }
    }

    public String decryptString(String cipherBase64) {
        if (cipherBase64 == null) return null;
        try {
            byte[] cipherMessage = Base64.getDecoder().decode(cipherBase64);
            byte[] decrypted = decrypt(cipherMessage);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            log.error("Decryption failed for string: {}", ex.getMessage());
            return cipherBase64; // Fallback in case of unencrypted legacy data
        }
    }
}
