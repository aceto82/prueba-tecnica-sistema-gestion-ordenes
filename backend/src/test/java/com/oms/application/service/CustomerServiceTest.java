package com.oms.application.service;

import com.oms.domain.exception.DuplicateEmailException;
import com.oms.domain.model.Customer;
import com.oms.domain.port.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerService customerService;

    @Test
    void createCustomer_withNewEmail_savesAndReturns() {
        Customer saved = Customer.rehydrate(1L, "Alice", "alice@example.com");
        when(customerRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(customerRepository.save(any())).thenReturn(saved);

        Customer result = customerService.createCustomer("Alice", "alice@example.com");

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("alice@example.com");
        verify(customerRepository).save(any());
    }

    @Test
    void createCustomer_withDuplicateEmail_throwsDuplicateEmailException() {
        when(customerRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> customerService.createCustomer("Alice", "alice@example.com"))
                .isInstanceOf(DuplicateEmailException.class)
                .hasMessageContaining("alice@example.com");

        verify(customerRepository, never()).save(any());
    }

    @Test
    void updateCustomer_withSameEmail_doesNotThrow() {
        Customer existing = Customer.rehydrate(1L, "Alice", "alice@example.com");
        Customer updated = Customer.rehydrate(1L, "Alice Updated", "alice@example.com");
        when(customerRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(customerRepository.existsByEmailAndIdNot("alice@example.com", 1L)).thenReturn(false);
        when(customerRepository.save(any())).thenReturn(updated);

        Customer result = customerService.updateCustomer(1L, "Alice Updated", "alice@example.com");

        assertThat(result.getName()).isEqualTo("Alice Updated");
        verify(customerRepository).save(any());
    }

    @Test
    void updateCustomer_withEmailTakenByOther_throwsDuplicateEmailException() {
        Customer existing = Customer.rehydrate(1L, "Alice", "alice@example.com");
        when(customerRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(customerRepository.existsByEmailAndIdNot("bob@example.com", 1L)).thenReturn(true);

        assertThatThrownBy(() -> customerService.updateCustomer(1L, "Alice", "bob@example.com"))
                .isInstanceOf(DuplicateEmailException.class);

        verify(customerRepository, never()).save(any());
    }

    @Test
    void getCustomerById_notFound_throwsEntityNotFoundException() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customerService.getCustomerById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
