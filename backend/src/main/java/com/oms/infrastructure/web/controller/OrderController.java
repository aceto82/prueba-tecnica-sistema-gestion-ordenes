package com.oms.infrastructure.web.controller;

import com.oms.application.service.CustomerService;
import com.oms.application.service.OrderService;
import com.oms.domain.model.Customer;
import com.oms.domain.model.Order;
import com.oms.domain.model.OrderStatus;
import com.oms.domain.port.OrderFilter;
import com.oms.infrastructure.web.dto.CreateOrderRequest;
import com.oms.infrastructure.web.dto.OrderResponse;
import com.oms.infrastructure.web.dto.UpdateOrderRequest;
import com.oms.infrastructure.web.mapper.OrderDtoMapper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final CustomerService customerService;

    public OrderController(OrderService orderService, CustomerService customerService) {
        this.orderService = orderService;
        this.customerService = customerService;
    }

    @GetMapping
    public Page<OrderResponse> listOrders(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) String customerName) {

        OrderFilter filter = new OrderFilter(status, dateFrom, dateTo, customerName);
        Page<Order> orders = orderService.listOrders(filter, pageable);
        return orders.map(order -> {
            Customer customer = customerService.getCustomerById(order.getCustomerId());
            return OrderDtoMapper.toResponse(order, customer);
        });
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        Customer customer = customerService.getCustomerById(order.getCustomerId());
        return OrderDtoMapper.toResponse(order, customer);
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrder(request.customerId(), request.total());
        Customer customer = customerService.getCustomerById(order.getCustomerId());
        return ResponseEntity.status(201).body(OrderDtoMapper.toResponse(order, customer));
    }

    @PutMapping("/{id}")
    public OrderResponse updateOrder(
            @PathVariable Long id,
            @RequestBody UpdateOrderRequest request) {

        Order order = null;

        if (request.status() != null) {
            order = orderService.transitionOrderStatus(id, request.status());
        }

        if (request.total() != null) {
            order = orderService.updateOrderDetails(id, request.total());
        }

        if (order == null) {
            order = orderService.getOrderById(id);
        }

        Customer customer = customerService.getCustomerById(order.getCustomerId());
        return OrderDtoMapper.toResponse(order, customer);
    }
}
