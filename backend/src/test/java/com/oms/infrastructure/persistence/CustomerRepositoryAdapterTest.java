package com.oms.infrastructure.persistence;

import com.oms.domain.model.Customer;
import com.oms.infrastructure.persistence.entity.CustomerJpaEntity;
import com.oms.infrastructure.persistence.repository.CustomerJpaRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Import(CustomerRepositoryAdapter.class)
class CustomerRepositoryAdapterTest {

    @Autowired
    private CustomerRepositoryAdapter adapter;

    @Autowired
    private CustomerJpaRepository jpaRepository;

    @Test
    void save_persistsCustomer() {
        Customer customer = Customer.create("Alice", "alice@example.com");

        Customer saved = adapter.save(customer);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getName()).isEqualTo("Alice");
        assertThat(saved.getEmail()).isEqualTo("alice@example.com");
    }

    @Test
    void findById_existingCustomer_returnsDomainCustomer() {
        CustomerJpaEntity entity = jpaRepository.save(new CustomerJpaEntity(null, "Bob", "bob@example.com"));

        Optional<Customer> result = adapter.findById(entity.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Bob");
    }

    @Test
    void existsByEmail_returnsTrue_whenEmailExists() {
        jpaRepository.save(new CustomerJpaEntity(null, "Carol", "carol@example.com"));

        assertThat(adapter.existsByEmail("carol@example.com")).isTrue();
        assertThat(adapter.existsByEmail("nobody@example.com")).isFalse();
    }

    @Test
    void existsByEmailAndIdNot_returnsFalse_forSameId() {
        CustomerJpaEntity entity = jpaRepository.save(new CustomerJpaEntity(null, "Dave", "dave@example.com"));

        // Same id → false (not taken by another customer)
        assertThat(adapter.existsByEmailAndIdNot("dave@example.com", entity.getId())).isFalse();
        // Different id → true (email is taken by entity)
        assertThat(adapter.existsByEmailAndIdNot("dave@example.com", 9999L)).isTrue();
    }

    @Test
    void findAll_pageable_returnsPagedResults() {
        jpaRepository.save(new CustomerJpaEntity(null, "Eve", "eve@example.com"));
        jpaRepository.save(new CustomerJpaEntity(null, "Frank", "frank@example.com"));
        jpaRepository.save(new CustomerJpaEntity(null, "Grace", "grace@example.com"));

        Page<Customer> page = adapter.findAll(PageRequest.of(0, 2));

        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getContent()).hasSize(2);
    }
}
