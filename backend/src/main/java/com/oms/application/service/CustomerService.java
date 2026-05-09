package com.oms.application.service;

import com.oms.domain.exception.DuplicateEmailException;
import com.oms.domain.model.Customer;
import com.oms.domain.port.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Page<Customer> listCustomers(Pageable pageable) {
        return customerRepository.findAll(pageable);
    }

    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + id));
    }

    public Customer createCustomer(String name, String email) {
        if (customerRepository.existsByEmail(email)) {
            throw new DuplicateEmailException(email);
        }
        return customerRepository.save(Customer.create(name, email));
    }

    public Customer updateCustomer(Long id, String name, String email) {
        Customer customer = getCustomerById(id);
        if (customerRepository.existsByEmailAndIdNot(email, id)) {
            throw new DuplicateEmailException(email);
        }
        customer.setName(name);
        customer.setEmail(email);
        return customerRepository.save(customer);
    }
}
