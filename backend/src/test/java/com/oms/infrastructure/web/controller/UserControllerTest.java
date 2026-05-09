package com.oms.infrastructure.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.application.service.UserService;
import com.oms.domain.exception.DuplicateUsernameException;
import com.oms.domain.model.Role;
import com.oms.domain.model.User;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = UserController.class, excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration.class,
        org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class
})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void listUsers_returns200WithPage() throws Exception {
        User user = User.rehydrate(1L, "alice", "pass", Role.USER);
        when(userService.findAll(any()))
                .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/users")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].username").value("alice"))
                .andExpect(jsonPath("$.content[0].role").value("USER"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void getUser_found_returns200() throws Exception {
        User user = User.rehydrate(1L, "alice", "pass", Role.USER);
        when(userService.getById(1L)).thenReturn(user);

        mockMvc.perform(get("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void getUser_notFound_returns404() throws Exception {
        when(userService.getById(99L))
                .thenThrow(new EntityNotFoundException("User not found with id: 99"));

        mockMvc.perform(get("/api/users/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("User not found with id: 99"));
    }

    @Test
    void createUser_valid_returns201() throws Exception {
        User created = User.rehydrate(2L, "bob", "hashed", Role.USER);
        when(userService.create("bob", "Pass123", Role.USER)).thenReturn(created);

        Map<String, Object> body = Map.of("username", "bob", "password", "Pass123", "role", "USER");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.username").value("bob"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void createUser_duplicateUsername_returns409() throws Exception {
        when(userService.create(any(), any(), any()))
                .thenThrow(new DuplicateUsernameException("bob"));

        Map<String, Object> body = Map.of("username", "bob", "password", "Pass123", "role", "USER");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void createUser_missingFields_returns400() throws Exception {
        Map<String, String> body = Map.of("username", "bob");

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void updateUser_valid_returns200() throws Exception {
        User updated = User.rehydrate(1L, "alice2", "hashed", Role.ADMIN);
        when(userService.update(eq(1L), eq("alice2"), eq(Role.ADMIN)))
                .thenReturn(updated);

        Map<String, Object> body = Map.of("username", "alice2", "role", "ADMIN");

        mockMvc.perform(put("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("alice2"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void updateUser_notFound_returns404() throws Exception {
        when(userService.update(eq(99L), any(), any()))
                .thenThrow(new EntityNotFoundException("User not found with id: 99"));

        Map<String, Object> body = Map.of("username", "nobody", "role", "USER");

        mockMvc.perform(put("/api/users/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteUser_existing_returns204() throws Exception {
        mockMvc.perform(delete("/api/users/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteUser_notFound_returns404() throws Exception {
        doThrow(new EntityNotFoundException("User not found with id: 99"))
                .when(userService).delete(99L);

        mockMvc.perform(delete("/api/users/99")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
