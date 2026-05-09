package com.oms.infrastructure.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateCustomerRequest(
        @NotBlank(message = "Name is required") String name,
        @NotBlank @Email(message = "Valid email is required") String email
) {}
