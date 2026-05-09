package com.oms.infrastructure.security;

import com.oms.config.JwtProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

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
}
