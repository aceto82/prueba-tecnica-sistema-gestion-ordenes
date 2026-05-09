package com.oms;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class OmsApplicationTest {

    @Test
    void contextLoads() {
        // Verifies that the Spring context starts correctly with the test H2 profile.
        // Any wiring or configuration issue will cause this test to fail.
    }
}
