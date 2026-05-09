package com.oms.infrastructure.web.dto;

import com.oms.domain.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
        @NotBlank(message = "Username is required") String username,
        @NotNull(message = "Role is required") Role role
) {}
