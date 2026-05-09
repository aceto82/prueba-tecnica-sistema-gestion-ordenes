package com.oms.infrastructure.web.controller;

import com.oms.application.service.CustomerService;
import com.oms.infrastructure.web.dto.CreateCustomerRequest;
import com.oms.infrastructure.web.dto.CustomerResponse;
import com.oms.infrastructure.web.dto.UpdateCustomerRequest;
import com.oms.infrastructure.web.mapper.CustomerDtoMapper;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public Page<CustomerResponse> listCustomers(
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return customerService.listCustomers(pageable).map(CustomerDtoMapper::toResponse);
    }

    @GetMapping("/{id}")
    public CustomerResponse getCustomer(@PathVariable Long id) {
        return CustomerDtoMapper.toResponse(customerService.getCustomerById(id));
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request) {
        CustomerResponse response = CustomerDtoMapper.toResponse(
                customerService.createCustomer(request.name(), request.email()));
        return ResponseEntity.status(201).body(response);
    }

    @PutMapping("/{id}")
    public CustomerResponse updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        return CustomerDtoMapper.toResponse(
                customerService.updateCustomer(id, request.name(), request.email()));
    }
}
