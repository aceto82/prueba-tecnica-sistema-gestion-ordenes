package com.oms.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.application.service.CustomerService;
import com.oms.domain.exception.DuplicateEmailException;
import com.oms.domain.model.Customer;
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

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = CustomerController.class, excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class
})
class CustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerService customerService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void listCustomers_returns200WithPage() throws Exception {
        Customer customer = Customer.rehydrate(1L, "Alice", "alice@example.com");
        when(customerService.listCustomers(any()))
                .thenReturn(new PageImpl<>(List.of(customer), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Alice"))
                .andExpect(jsonPath("$.content[0].email").value("alice@example.com"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getCustomer_found_returns200() throws Exception {
        Customer customer = Customer.rehydrate(1L, "Alice", "alice@example.com");
        when(customerService.getCustomerById(1L)).thenReturn(customer);

        mockMvc.perform(get("/api/customers/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alice"))
                .andExpect(jsonPath("$.email").value("alice@example.com"));
    }

    @Test
    void getCustomer_notFound_returns404() throws Exception {
        when(customerService.getCustomerById(99L))
                .thenThrow(new EntityNotFoundException("Customer not found with id: 99"));

        mockMvc.perform(get("/api/customers/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Customer not found with id: 99"));
    }

    @Test
    void createCustomer_valid_returns201() throws Exception {
        Customer created = Customer.rehydrate(2L, "Bob", "bob@example.com");
        when(customerService.createCustomer("Bob", "bob@example.com")).thenReturn(created);

        Map<String, String> body = Map.of("name", "Bob", "email", "bob@example.com");

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Bob"))
                .andExpect(jsonPath("$.email").value("bob@example.com"));
    }

    @Test
    void createCustomer_blankName_returns400() throws Exception {
        Map<String, String> body = Map.of("name", "", "email", "bob@example.com");

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void createCustomer_duplicateEmail_returns409() throws Exception {
        when(customerService.createCustomer(any(), any()))
                .thenThrow(new DuplicateEmailException("alice@example.com"));

        Map<String, String> body = Map.of("name", "Alice2", "email", "alice@example.com");

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void updateCustomer_valid_returns200() throws Exception {
        Customer updated = Customer.rehydrate(1L, "Alice Updated", "alice2@example.com");
        when(customerService.updateCustomer(eq(1L), eq("Alice Updated"), eq("alice2@example.com")))
                .thenReturn(updated);

        Map<String, String> body = Map.of("name", "Alice Updated", "email", "alice2@example.com");

        mockMvc.perform(put("/api/customers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alice Updated"))
                .andExpect(jsonPath("$.email").value("alice2@example.com"));
    }
}
