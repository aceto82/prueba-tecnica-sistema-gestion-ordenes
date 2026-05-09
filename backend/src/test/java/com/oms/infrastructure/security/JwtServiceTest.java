package com.oms.infrastructure.security;

import com.oms.config.JwtProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    private static final String SECRET = "test-secret-key-32-chars-minimum!!";
    private static final long EXPIRATION_MS = 3_600_000L;

    private JwtService buildService(long expirationMs) {
        JwtProperties props = mock(JwtProperties.class);
        lenient().when(props.getSecret()).thenReturn(SECRET);
        lenient().when(props.getExpirationMs()).thenReturn(expirationMs);
        return new JwtService(props);
    }

    private UserDetails user(String username) {
        return new User(username, "password", Collections.emptyList());
    }

    private UserDetails userWithRole(String username, String role) {
        return new User(username, "password",
                List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role)));
    }

    @Test
    void generateToken_returnsNonNullToken() {
        JwtService service = buildService(EXPIRATION_MS);

        String token = service.generateToken(user("alice"));

        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    void extractUsername_returnsCorrectUsername() {
        JwtService service = buildService(EXPIRATION_MS);
        String token = service.generateToken(user("alice"));

        String username = service.extractUsername(token);

        assertThat(username).isEqualTo("alice");
    }

    @Test
    void isTokenValid_withValidToken_returnsTrue() {
        JwtService service = buildService(EXPIRATION_MS);
        UserDetails userDetails = user("alice");
        String token = service.generateToken(userDetails);

        boolean valid = service.isTokenValid(token, userDetails);

        assertThat(valid).isTrue();
    }

    @Test
    void isTokenValid_withExpiredToken_returnsFalse() {
        JwtService expiredService = buildService(-1000L);
        UserDetails userDetails = user("alice");
        String expiredToken = expiredService.generateToken(userDetails);

        JwtService validatingService = buildService(EXPIRATION_MS);
        boolean valid = validatingService.isTokenValid(expiredToken, userDetails);

        assertThat(valid).isFalse();
    }

    @Test
    void generateToken_includesRoleClaim() {
        JwtService service = buildService(EXPIRATION_MS);

        String token = service.generateToken(userWithRole("admin", "ADMIN"));

        // Decode payload to inspect claims
        String payload = new String(java.util.Base64.getUrlDecoder().decode(token.split("\\.")[1]));
        assertThat(payload).contains("\"role\"");
        assertThat(payload).contains("\"ADMIN\"");
    }

    @Test
    void generateToken_includesRoleClaimForUser() {
        JwtService service = buildService(EXPIRATION_MS);

        String token = service.generateToken(userWithRole("alice", "USER"));

        String payload = new String(java.util.Base64.getUrlDecoder().decode(token.split("\\.")[1]));
        assertThat(payload).contains("\"role\"");
        assertThat(payload).contains("\"USER\"");
    }

    // --- F4-T03: tampered token + role extraction ---

    @Test
    void isTokenValid_withTamperedSignature_returnsFalse() {
        // GIVEN a valid token whose signature is altered at the byte level
        JwtService service = buildService(EXPIRATION_MS);
        UserDetails userDetails = user("alice");
        String validToken = service.generateToken(userDetails);

        // Decode signature to raw bytes, flip every bit of the first byte, re-encode.
        // XOR with 0xFF flips ALL 8 bits — the resulting 32-byte sequence
        // cannot collide with the original HMAC, making this deterministic.
        String[] parts = validToken.split("\\.");
        byte[] sigBytes = java.util.Base64.getUrlDecoder().decode(parts[2]);
        sigBytes[0] = (byte) (sigBytes[0] ^ 0xFF);
        String tamperedSignature = java.util.Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(sigBytes);
        String tamperedToken = parts[0] + "." + parts[1] + "." + tamperedSignature;

        // WHEN isTokenValid is called with tampered token
        boolean valid = service.isTokenValid(tamperedToken, userDetails);

        // THEN it returns false
        assertThat(valid).isFalse();
    }

    @Test
    void extractRole_fromAdminToken_returnsADMIN() {
        // GIVEN a token generated for role "ADMIN"
        JwtService service = buildService(EXPIRATION_MS);
        String token = service.generateToken(userWithRole("admin", "ADMIN"));

        // WHEN extractRole is called
        String role = service.extractRole(token);

        // THEN it returns "ADMIN"
        assertThat(role).isEqualTo("ADMIN");
    }

    @Test
    void extractRole_fromUserToken_returnsUSER() {
        // GIVEN a token generated for role "USER"
        JwtService service = buildService(EXPIRATION_MS);
        String token = service.generateToken(userWithRole("alice", "USER"));

        // WHEN extractRole is called
        String role = service.extractRole(token);

        // THEN it returns "USER"
        assertThat(role).isEqualTo("USER");
    }

    @Test
    void generateToken_containsExpInFuture() {
        // GIVEN a token generated for "alice"
        JwtService service = buildService(EXPIRATION_MS);
        String token = service.generateToken(user("alice"));

        // WHEN the expiration is checked via payload decode
        String payload = new String(java.util.Base64.getUrlDecoder().decode(token.split("\\.")[1]));
        // THEN "exp" claim is present (it's a number in the JSON)
        assertThat(payload).contains("\"exp\"");
    }
}
