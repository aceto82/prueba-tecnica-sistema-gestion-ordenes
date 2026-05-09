package com.oms.infrastructure.web.dto;

import com.oms.domain.model.Role;

public record UserResponse(Long id, String username, Role role) {}
