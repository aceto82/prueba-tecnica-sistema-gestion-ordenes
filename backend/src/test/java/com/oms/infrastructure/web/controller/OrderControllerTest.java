package com.oms.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.application.service.CustomerService;
import com.oms.application.service.OrderService;
import com.oms.domain.exception.InvalidStatusTransitionException;
import com.oms.domain.model.Customer;
import com.oms.domain.model.Order;
import com.oms.domain.model.OrderStatus;
import com.oms.infrastructure.security.JwtService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = OrderController.class, excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class
})
class OrderControllerTest {

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
    private UserDetailsService userDetailsService;

    private Customer sampleCustomer() {
        return Customer.rehydrate(1L, "Alice", "alice@example.com");
    }

    private Order sampleOrder() {
        return Order.rehydrate(7L, OrderStatus.PENDING, new BigDecimal("150.00"),
                LocalDateTime.of(2025, 1, 1, 0, 0), 1L);
    }

    @Test
    void listOrders_noFilter_returns200WithPage() throws Exception {
        Order order = sampleOrder();
        Customer customer = sampleCustomer();
        when(orderService.listOrders(any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(order), PageRequest.of(0, 10), 1));
        when(customerService.getCustomerById(1L)).thenReturn(customer);

        mockMvc.perform(get("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(7))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"))
                .andExpect(jsonPath("$.content[0].customer.id").value(1))
                .andExpect(jsonPath("$.content[0].customer.name").value("Alice"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listOrders_withStatusFilter_returns200() throws Exception {
        Order order = sampleOrder();
        Customer customer = sampleCustomer();
        when(orderService.listOrders(any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(order), PageRequest.of(0, 10), 1));
        when(customerService.getCustomerById(1L)).thenReturn(customer);

        mockMvc.perform(get("/api/orders?status=PENDING")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));
    }

    @Test
    void getOrder_found_returns200WithCustomerSummary() throws Exception {
        Order order = sampleOrder();
        Customer customer = sampleCustomer();
        when(orderService.getOrderById(7L)).thenReturn(order);
        when(customerService.getCustomerById(1L)).thenReturn(customer);

        mockMvc.perform(get("/api/orders/7")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.total").value(150.00))
                .andExpect(jsonPath("$.customer.id").value(1))
                .andExpect(jsonPath("$.customer.name").value("Alice"));
    }

    @Test
    void getOrder_notFound_returns404() throws Exception {
        when(orderService.getOrderById(999L))
                .thenThrow(new EntityNotFoundException("Order not found with id: 999"));

        mockMvc.perform(get("/api/orders/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Order not found with id: 999"));
    }

    @Test
    void createOrder_valid_returns201() throws Exception {
        Order created = sampleOrder();
        Customer customer = sampleCustomer();
        when(orderService.createOrder(eq(1L), any(BigDecimal.class))).thenReturn(created);
        when(customerService.getCustomerById(1L)).thenReturn(customer);

        String body = "{\"customerId\":1,\"total\":150.00}";

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.customer.id").value(1));
    }

    @Test
    void createOrder_nullCustomerId_returns400() throws Exception {
        Map<String, Object> body = Map.of("total", 150.00);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void updateOrder_statusTransition_returns200() throws Exception {
        Order updated = Order.rehydrate(7L, OrderStatus.PROCESSING, new BigDecimal("150.00"),
                LocalDateTime.of(2025, 1, 1, 0, 0), 1L);
        Customer customer = sampleCustomer();
        when(orderService.transitionOrderStatus(eq(7L), eq(OrderStatus.PROCESSING))).thenReturn(updated);
        when(customerService.getCustomerById(1L)).thenReturn(customer);

        Map<String, String> body = Map.of("status", "PROCESSING");

        mockMvc.perform(put("/api/orders/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.status").value("PROCESSING"));
    }

    // --- TD-3: DELETE /api/orders/{id} ---

    @Test
    void deleteOrder_existingOrder_returns204() throws Exception {
        // GIVEN an existing order
        // WHEN DELETE /api/orders/7
        mockMvc.perform(delete("/api/orders/7")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        // THEN orderService.deleteOrder(7L) is called
        verify(orderService).deleteOrder(7L);
    }

    @Test
    void deleteOrder_nonExistentOrder_returns404() throws Exception {
        // GIVEN no order with id 999 exists
        doThrow(new EntityNotFoundException("Order not found with id: 999"))
                .when(orderService).deleteOrder(999L);

        // WHEN DELETE /api/orders/999, THEN 404
        mockMvc.perform(delete("/api/orders/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Order not found with id: 999"));
    }

    @Test
    void updateOrder_invalidTransition_returns400() throws Exception {
        when(orderService.transitionOrderStatus(eq(7L), eq(OrderStatus.COMPLETED)))
                .thenThrow(new InvalidStatusTransitionException(OrderStatus.PENDING, OrderStatus.COMPLETED));

        Map<String, String> body = Map.of("status", "COMPLETED");

        mockMvc.perform(put("/api/orders/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
