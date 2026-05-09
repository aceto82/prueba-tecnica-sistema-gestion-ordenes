package com.oms.infrastructure.web.dto;

import com.oms.domain.model.Role;

import java.time.Instant;

public record UserResponse(Long id, String username, Role role, Instant createdAt) {}
