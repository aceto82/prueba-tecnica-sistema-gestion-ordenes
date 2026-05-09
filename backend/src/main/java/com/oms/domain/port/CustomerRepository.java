package com.oms.domain.port;

import com.oms.domain.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository {

    Optional<Customer> findById(Long id);

    List<Customer> findAll();

    Page<Customer> findAll(Pageable pageable);

    Customer save(Customer customer);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);
}
