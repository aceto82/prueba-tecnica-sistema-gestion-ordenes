package com.oms.infrastructure.web.controller;

import com.oms.domain.exception.DuplicateEmailException;
import com.oms.domain.exception.InvalidStatusTransitionException;
import com.oms.domain.model.OrderStatus;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit test for GlobalExceptionHandler — no Spring context required.
 * Tests all 6 exception-to-ProblemDetail mappings.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    // --- Handler: MethodArgumentNotValidException → 400 ---

    @Test
    void handleValidationErrors_returns400WithErrors() throws NoSuchMethodException {
        // Build a MethodArgumentNotValidException with one field error
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError("request", "name", "must not be blank"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ProblemDetail pd = handler.handleValidationErrors(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getDetail()).isEqualTo("Validation failed");

        @SuppressWarnings("unchecked")
        List<String> errors = (List<String>) pd.getProperties().get("errors");
        assertThat(errors).isNotNull().hasSize(1);
        assertThat(errors.get(0)).contains("name").contains("must not be blank");
    }

    // --- Handler: BadCredentialsException → 401 ---

    @Test
    void handleBadCredentials_returns401() {
        BadCredentialsException ex = new BadCredentialsException("Bad credentials");

        ProblemDetail pd = handler.handleBadCredentials(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(pd.getDetail()).isEqualTo("Invalid username or password");
    }

    // --- Handler: AccessDeniedException → 403 ---

    @Test
    void handleAccessDenied_returns403() {
        AccessDeniedException ex = new AccessDeniedException("Access denied");

        ProblemDetail pd = handler.handleAccessDenied(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(pd.getDetail()).isEqualTo("Access denied");
    }

    // --- Handler: InvalidStatusTransitionException → 400 ---

    @Test
    void handleInvalidTransition_returns400WithMessage() {
        InvalidStatusTransitionException ex =
                new InvalidStatusTransitionException(OrderStatus.COMPLETED, OrderStatus.PENDING);

        ProblemDetail pd = handler.handleInvalidTransition(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getDetail()).contains("COMPLETED").contains("PENDING");
    }

    // --- Handler: DuplicateEmailException → 409 ---

    @Test
    void handleDuplicateEmail_returns409WithEmail() {
        DuplicateEmailException ex = new DuplicateEmailException("alice@example.com");

        ProblemDetail pd = handler.handleDuplicateEmail(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(pd.getDetail()).contains("alice@example.com");
    }

    // --- Handler: EntityNotFoundException → 404 ---

    @Test
    void handleEntityNotFound_returns404WithMessage() {
        EntityNotFoundException ex = new EntityNotFoundException("Order not found with id: 42");

        ProblemDetail pd = handler.handleEntityNotFound(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(pd.getDetail()).isEqualTo("Order not found with id: 42");
    }

    // --- Handler: generic Exception → 500 ---

    @Test
    void handleGeneric_returns500() {
        RuntimeException ex = new RuntimeException("Unexpected database error");

        ProblemDetail pd = handler.handleGeneric(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(pd.getDetail()).isEqualTo("An unexpected error occurred");
    }
}
