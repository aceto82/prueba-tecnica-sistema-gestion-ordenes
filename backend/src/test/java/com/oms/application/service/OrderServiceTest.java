package com.oms.application.service;

import com.oms.domain.exception.InvalidStatusTransitionException;
import com.oms.domain.model.Customer;
import com.oms.domain.model.Order;
import com.oms.domain.model.OrderStatus;
import com.oms.domain.port.CustomerRepository;
import com.oms.domain.port.OrderFilter;
import com.oms.domain.port.OrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private OrderService orderService;

    private Customer alice() {
        return Customer.rehydrate(1L, "Alice", "alice@example.com");
    }

    private Order pendingOrder() {
        return Order.rehydrate(10L, OrderStatus.PENDING, new BigDecimal("100.00"), LocalDateTime.now(), 1L);
    }

    private Order processingOrder() {
        return Order.rehydrate(11L, OrderStatus.PROCESSING, new BigDecimal("100.00"), LocalDateTime.now(), 1L);
    }

    @Test
    void createOrder_withValidCustomer_returnsPendingOrder() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(alice()));
        Order saved = Order.rehydrate(10L, OrderStatus.PENDING, new BigDecimal("150.00"), LocalDateTime.now(), 1L);
        when(orderRepository.save(any())).thenReturn(saved);

        Order result = orderService.createOrder(1L, new BigDecimal("150.00"));

        assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
        assertThat(result.getCustomerId()).isEqualTo(1L);
        verify(orderRepository).save(any());
    }

    @Test
    void createOrder_withInvalidCustomer_throwsEntityNotFoundException() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.createOrder(99L, new BigDecimal("100.00")))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void transitionOrderStatus_validTransition_updatesStatus() {
        Order pending = pendingOrder();
        Order processing = Order.rehydrate(10L, OrderStatus.PROCESSING, new BigDecimal("100.00"), LocalDateTime.now(), 1L);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(pending));
        when(orderRepository.save(any())).thenReturn(processing);

        Order result = orderService.transitionOrderStatus(10L, OrderStatus.PROCESSING);

        assertThat(result.getStatus()).isEqualTo(OrderStatus.PROCESSING);
        verify(orderRepository).save(any());
    }

    @Test
    void transitionOrderStatus_invalidTransition_throwsInvalidStatusTransitionException() {
        Order completed = Order.rehydrate(12L, OrderStatus.COMPLETED, BigDecimal.TEN, LocalDateTime.now(), 1L);
        when(orderRepository.findById(12L)).thenReturn(Optional.of(completed));

        assertThatThrownBy(() -> orderService.transitionOrderStatus(12L, OrderStatus.PENDING))
                .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    void updateOrderDetails_onPendingOrder_updatesTotal() {
        Order pending = pendingOrder();
        Order updated = Order.rehydrate(10L, OrderStatus.PENDING, new BigDecimal("250.00"), LocalDateTime.now(), 1L);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(pending));
        when(orderRepository.save(any())).thenReturn(updated);

        Order result = orderService.updateOrderDetails(10L, new BigDecimal("250.00"));

        assertThat(result.getTotal()).isEqualByComparingTo("250.00");
        verify(orderRepository).save(any());
    }

    @Test
    void updateOrderDetails_onNonPendingOrder_throwsException() {
        Order processing = processingOrder();
        when(orderRepository.findById(11L)).thenReturn(Optional.of(processing));

        assertThatThrownBy(() -> orderService.updateOrderDetails(11L, new BigDecimal("250.00")))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void listOrders_withUsername_passesUsernameToRepository() {
        OrderFilter filter = new OrderFilter(null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Order> expectedPage = new PageImpl<>(List.of(pendingOrder()), pageable, 1);

        when(orderRepository.findAll(eq(filter), eq(pageable), eq("alice")))
                .thenReturn(expectedPage);

        Page<Order> result = orderService.listOrders(filter, pageable, "alice");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo(10L);
    }

    @Test
    void listOrders_withoutUsername_passesNullToRepository() {
        OrderFilter filter = new OrderFilter(null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Order> expectedPage = new PageImpl<>(List.of(pendingOrder()), pageable, 1);

        when(orderRepository.findAll(eq(filter), eq(pageable), eq(null)))
                .thenReturn(expectedPage);

        Page<Order> result = orderService.listOrders(filter, pageable, null);

        assertThat(result.getContent()).hasSize(1);
    }

    // --- Role-scoping spec scenarios (F4-T01) ---

    @Test
    void listOrders_userRole_scopesByUsername_returnsOnlyOwnOrders() {
        // GIVEN three orders exist, two for "alice" and one for "bob"
        // WHEN service is called with username="alice" (USER role scenario)
        // THEN only alice's orders are returned
        OrderFilter filter = new OrderFilter(null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);
        Order aliceOrder1 = Order.rehydrate(1L, OrderStatus.PENDING, new BigDecimal("50.00"), LocalDateTime.now(), 1L);
        Order aliceOrder2 = Order.rehydrate(2L, OrderStatus.PROCESSING, new BigDecimal("75.00"), LocalDateTime.now(), 1L);
        Page<Order> alicePage = new PageImpl<>(List.of(aliceOrder1, aliceOrder2), pageable, 2);

        when(orderRepository.findAll(eq(filter), eq(pageable), eq("alice")))
                .thenReturn(alicePage);

        Page<Order> result = orderService.listOrders(filter, pageable, "alice");

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    // --- TD-3: DELETE /api/orders/{id} ---

    @Test
    void deleteOrder_existingOrder_deletesSuccessfully() {
        // GIVEN an order with id 10 exists
        when(orderRepository.existsById(10L)).thenReturn(true);

        // WHEN deleteOrder is called
        orderService.deleteOrder(10L);

        // THEN the repository's deleteById is invoked once with the given id
        verify(orderRepository).deleteById(10L);
    }

    @Test
    void deleteOrder_nonExistentOrder_throwsEntityNotFoundException() {
        // GIVEN no order with id 99 exists
        when(orderRepository.existsById(99L)).thenReturn(false);

        // WHEN deleteOrder is called, THEN it throws EntityNotFoundException
        assertThatThrownBy(() -> orderService.deleteOrder(99L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("99");

        // AND deleteById is never called
        verify(orderRepository, never()).deleteById(any());
    }

    @Test
    void listOrders_adminRole_returnsAllOrders_byPassingNullUsername() {
        // GIVEN three orders from different users
        // WHEN service is called with username=null (ADMIN role scenario)
        // THEN all three orders are returned
        OrderFilter filter = new OrderFilter(null, null, null, null);
        Pageable pageable = PageRequest.of(0, 10);
        Order o1 = Order.rehydrate(1L, OrderStatus.PENDING, new BigDecimal("50.00"), LocalDateTime.now(), 1L);
        Order o2 = Order.rehydrate(2L, OrderStatus.PROCESSING, new BigDecimal("75.00"), LocalDateTime.now(), 2L);
        Order o3 = Order.rehydrate(3L, OrderStatus.COMPLETED, new BigDecimal("200.00"), LocalDateTime.now(), 3L);
        Page<Order> allOrders = new PageImpl<>(List.of(o1, o2, o3), pageable, 3);

        when(orderRepository.findAll(eq(filter), eq(pageable), eq(null)))
                .thenReturn(allOrders);

        Page<Order> result = orderService.listOrders(filter, pageable, null);

        assertThat(result.getContent()).hasSize(3);
        assertThat(result.getTotalElements()).isEqualTo(3);
    }
}
