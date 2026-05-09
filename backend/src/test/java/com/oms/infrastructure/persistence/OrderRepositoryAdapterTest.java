package com.oms.infrastructure.persistence;

import com.oms.domain.model.Order;
import com.oms.domain.model.OrderStatus;
import com.oms.domain.port.OrderFilter;
import com.oms.infrastructure.persistence.entity.CustomerJpaEntity;
import com.oms.infrastructure.persistence.entity.OrderJpaEntity;
import com.oms.infrastructure.persistence.repository.CustomerJpaRepository;
import com.oms.infrastructure.persistence.repository.OrderJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@Import(OrderRepositoryAdapter.class)
class OrderRepositoryAdapterTest {

    @Autowired
    private OrderRepositoryAdapter adapter;

    @Autowired
    private OrderJpaRepository orderJpaRepository;

    @Autowired
    private CustomerJpaRepository customerJpaRepository;

    private CustomerJpaEntity alice;
    private CustomerJpaEntity bob;

    @BeforeEach
    void setUp() {
        orderJpaRepository.deleteAll();
        customerJpaRepository.deleteAll();

        alice = new CustomerJpaEntity();
        alice.setName("Alice");
        alice.setEmail("alice@example.com");
        alice.setUserId("alice");
        alice = customerJpaRepository.save(alice);

        bob = new CustomerJpaEntity();
        bob.setName("Bob");
        bob.setEmail("bob@example.com");
        bob.setUserId("bob");
        bob = customerJpaRepository.save(bob);
    }

    private OrderJpaEntity persistOrder(OrderStatus status, BigDecimal total, CustomerJpaEntity customer) {
        OrderJpaEntity entity = new OrderJpaEntity();
        entity.setStatus(status);
        entity.setTotal(total);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setCustomer(customer);
        return orderJpaRepository.save(entity);
    }

    // --- Scenario: find orders by status ---

    @Test
    void findAll_filterByStatus_returnsOnlyMatchingStatus() {
        // GIVEN two PENDING orders and one COMPLETED order
        persistOrder(OrderStatus.PENDING, new BigDecimal("100.00"), alice);
        persistOrder(OrderStatus.PENDING, new BigDecimal("200.00"), bob);
        persistOrder(OrderStatus.COMPLETED, new BigDecimal("300.00"), alice);

        OrderFilter filter = new OrderFilter(OrderStatus.PENDING, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);

        // WHEN queried with status=PENDING
        Page<Order> result = adapter.findAll(filter, pageable);

        // THEN only the two PENDING orders are returned
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allMatch(o -> o.getStatus() == OrderStatus.PENDING);
    }

    // --- Scenario: find orders by username (scoped via customer.userId) ---

    @Test
    void findAll_withUsername_returnsOnlyOrdersForThatUser() {
        // GIVEN two orders for alice and one for bob
        persistOrder(OrderStatus.PENDING, new BigDecimal("50.00"), alice);
        persistOrder(OrderStatus.PROCESSING, new BigDecimal("75.00"), alice);
        persistOrder(OrderStatus.PENDING, new BigDecimal("120.00"), bob);

        OrderFilter filter = new OrderFilter(null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);

        // WHEN queried with username="alice"
        Page<Order> result = adapter.findAll(filter, pageable, "alice");

        // THEN only alice's two orders are returned
        assertThat(result.getContent()).hasSize(2);
    }

    @Test
    void findAll_withUsername_doesNotReturnOtherUsersOrders() {
        // GIVEN one order for alice, one for bob
        persistOrder(OrderStatus.PENDING, new BigDecimal("50.00"), alice);
        persistOrder(OrderStatus.PENDING, new BigDecimal("90.00"), bob);

        OrderFilter filter = new OrderFilter(null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);

        Page<Order> result = adapter.findAll(filter, pageable, "bob");

        assertThat(result.getContent()).hasSize(1);
        // The returned order's customerId should be bob's
        assertThat(result.getContent().get(0).getCustomerId()).isEqualTo(bob.getId());
    }

    // --- Scenario: paginated retrieval respects page size ---

    @Test
    void findAll_pageable_respectsPageSize() {
        // GIVEN five orders exist
        for (int i = 0; i < 5; i++) {
            persistOrder(OrderStatus.PENDING, new BigDecimal("10.00"), alice);
        }

        Pageable pageable = PageRequest.of(0, 2);
        OrderFilter emptyFilter = new OrderFilter(null, null, null, null);

        // WHEN first page of size 2 is requested
        Page<Order> page = adapter.findAll(emptyFilter, pageable);

        // THEN only 2 results on this page, total is 5
        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(5);
    }

    // --- Scenario: save and findById ---

    @Test
    void save_persistsOrderAndFindById_returnsIt() {
        Order order = Order.create(OrderStatus.PENDING, new BigDecimal("150.00"), alice.getId());

        Order saved = adapter.save(order);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(saved.getCustomerId()).isEqualTo(alice.getId());

        assertThat(adapter.findById(saved.getId())).isPresent();
    }

    // --- Scenario: findAll with null username returns all orders ---

    @Test
    void findAll_withNullUsername_returnsAllOrders() {
        persistOrder(OrderStatus.PENDING, new BigDecimal("50.00"), alice);
        persistOrder(OrderStatus.PENDING, new BigDecimal("90.00"), bob);

        OrderFilter filter = new OrderFilter(null, null, null, null);
        Page<Order> result = adapter.findAll(filter, PageRequest.of(0, 10), null);

        assertThat(result.getTotalElements()).isEqualTo(2);
    }
}
