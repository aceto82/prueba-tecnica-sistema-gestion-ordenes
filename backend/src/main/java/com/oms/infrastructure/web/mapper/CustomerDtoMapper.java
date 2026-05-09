package com.oms.infrastructure.web.mapper;

import com.oms.domain.model.Customer;
import com.oms.infrastructure.web.dto.CustomerResponse;

public class CustomerDtoMapper {

    private CustomerDtoMapper() {}

    public static CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(customer.getId(), customer.getName(), customer.getEmail());
    }
}
