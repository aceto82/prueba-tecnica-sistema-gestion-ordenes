package com.oms.infrastructure.persistence.mapper;

import com.oms.domain.model.Customer;
import com.oms.infrastructure.persistence.entity.CustomerJpaEntity;

public final class CustomerMapper {

    private CustomerMapper() {
        // utility class — no instantiation
    }

    public static Customer toDomain(CustomerJpaEntity entity) {
        if (entity == null) return null;
        return Customer.rehydrate(
                entity.getId(),
                entity.getName(),
                entity.getEmail()
        );
    }

    public static CustomerJpaEntity toJpa(Customer customer) {
        if (customer == null) return null;
        return new CustomerJpaEntity(
                customer.getId(),
                customer.getName(),
                customer.getEmail()
        );
    }
}
