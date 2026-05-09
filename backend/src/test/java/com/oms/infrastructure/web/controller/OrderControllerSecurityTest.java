package com.oms.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.application.service.CustomerService;
import com.oms.application.service.OrderService;
import com.oms.config.SecurityConfig;
import com.oms.domain.model.Customer;
import com.oms.domain.model.Order;
import com.oms.domain.model.OrderStatus;
import com.oms.infrastructure.security.JwtAuthenticationFilter;
import com.oms.infrastructure.security.JwtService;
import com.oms.infrastructure.security.UserDetailsServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Security-focused @WebMvcTest for OrderController.
 * Validates 401 (no token) and confirms USER role can access orders.
 */
@WebMvcTest(
        value = OrderController.class,
        excludeAutoConfiguration = {
                org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class
        }
)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class OrderControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @MockBean
    private CustomerService customerService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    private Order sampleOrder() {
        return Order.rehydrate(7L, OrderStatus.PENDING, new BigDecimal("150.00"),
                LocalDateTime.of(2025, 1, 1, 0, 0), 1L);
    }

    private Customer sampleCustomer() {
        return Customer.rehydrate(1L, "Alice", "alice@example.com");
    }

    // --- Scenario: protected endpoint returns 401 without authentication ---

    @Test
    void listOrders_withoutAuthentication_returns401() throws Exception {
        mockMvc.perform(get("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // --- Scenario: authenticated USER can access orders ---

    @Test
    @WithMockUser(roles = "USER")
    void listOrders_withUserRole_returns200() throws Exception {
        when(orderService.listOrders(any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(sampleOrder()), PageRequest.of(0, 10), 1));
        when(customerService.getCustomerById(1L)).thenReturn(sampleCustomer());

        mockMvc.perform(get("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    // --- Scenario: invalid body returns 400 with problem+json ---

    @Test
    @WithMockUser(roles = "USER")
    void createOrder_missingRequiredFields_returns400() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
