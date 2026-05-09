package com.oms.infrastructure.persistence.specification;

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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class OrderSpecificationTest {

    @Autowired
    private OrderJpaRepository orderJpaRepository;

    @Autowired
    private CustomerJpaRepository customerJpaRepository;

    private CustomerJpaEntity alice;
    private CustomerJpaEntity bob;
    private CustomerJpaEntity carol;

    @BeforeEach
    void setUp() {
        alice = customerJpaRepository.save(new CustomerJpaEntity(null, "Alice Smith", "alice@example.com"));
        bob = customerJpaRepository.save(new CustomerJpaEntity(null, "Bob Jones", "bob@example.com"));
        carol = customerJpaRepository.save(new CustomerJpaEntity(null, "Carol White", "carol@example.com"));

        // Order 1: PENDING, Alice, today
        OrderJpaEntity o1 = new OrderJpaEntity();
        o1.setStatus(OrderStatus.PENDING);
        o1.setTotal(new BigDecimal("100.00"));
        o1.setCreatedAt(LocalDateTime.now());
        o1.setCustomer(alice);
        orderJpaRepository.save(o1);

        // Order 2: PROCESSING, Bob, 10 days ago
        OrderJpaEntity o2 = new OrderJpaEntity();
        o2.setStatus(OrderStatus.PROCESSING);
        o2.setTotal(new BigDecimal("200.00"));
        o2.setCreatedAt(LocalDateTime.now().minusDays(10));
        o2.setCustomer(bob);
        orderJpaRepository.save(o2);

        // Order 3: COMPLETED, Carol, 20 days ago
        OrderJpaEntity o3 = new OrderJpaEntity();
        o3.setStatus(OrderStatus.COMPLETED);
        o3.setTotal(new BigDecimal("300.00"));
        o3.setCreatedAt(LocalDateTime.now().minusDays(20));
        o3.setCustomer(carol);
        orderJpaRepository.save(o3);
    }

    @Test
    void hasStatus_filtersCorrectly() {
        Specification<OrderJpaEntity> spec = OrderSpecification.hasStatus(OrderStatus.PENDING);
        Page<OrderJpaEntity> result = orderJpaRepository.findAll(spec, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(OrderStatus.PENDING);
    }

    @Test
    void customerNameContains_caseInsensitive() {
        Specification<OrderJpaEntity> spec = OrderSpecification.customerNameContains("alice");
        Page<OrderJpaEntity> result = orderJpaRepository.findAll(spec, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getCustomer().getName()).isEqualTo("Alice Smith");
    }

    @Test
    void createdAfter_filtersCorrectly() {
        // Only orders created in the last 5 days (just Alice's order)
        Specification<OrderJpaEntity> spec = OrderSpecification.createdAfter(LocalDate.now().minusDays(5));
        Page<OrderJpaEntity> result = orderJpaRepository.findAll(spec, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
    }

    @Test
    void fromFilter_withNullFields_returnsAll() {
        Specification<OrderJpaEntity> spec = OrderSpecification.fromFilter(
                new OrderFilter(null, null, null, null));
        Page<OrderJpaEntity> result = orderJpaRepository.findAll(spec, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(3);
    }

    @Test
    void fromFilter_combined_filtersCorrectly() {
        // PENDING + customer name contains "alice" → should return exactly 1
        Specification<OrderJpaEntity> spec = OrderSpecification.fromFilter(
                new OrderFilter(OrderStatus.PENDING, null, null, "alice"));
        Page<OrderJpaEntity> result = orderJpaRepository.findAll(spec, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(result.getContent().get(0).getCustomer().getName()).isEqualTo("Alice Smith");
    }
}
