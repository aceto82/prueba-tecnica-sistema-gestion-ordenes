package com.oms.config;

import com.oms.domain.model.OrderStatus;
import com.oms.domain.model.Role;
import com.oms.domain.model.User;
import com.oms.domain.port.UserRepository;
import com.oms.infrastructure.persistence.entity.CustomerJpaEntity;
import com.oms.infrastructure.persistence.entity.OrderJpaEntity;
import com.oms.infrastructure.persistence.repository.CustomerJpaRepository;
import com.oms.infrastructure.persistence.repository.OrderJpaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@Profile("dev")
public class DevDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerJpaRepository customerJpaRepository;
    private final OrderJpaRepository orderJpaRepository;

    public DevDataSeeder(UserRepository userRepository,
                         PasswordEncoder passwordEncoder,
                         CustomerJpaRepository customerJpaRepository,
                         OrderJpaRepository orderJpaRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.customerJpaRepository = customerJpaRepository;
        this.orderJpaRepository = orderJpaRepository;
    }

    @Override
    public void run(String... args) {
        seedAdmin();
        seedCustomers();
        seedOrders();
    }

    private void seedAdmin() {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = User.create("admin", passwordEncoder.encode("admin123"), Role.ADMIN);
            userRepository.save(admin);
        }
    }

    private void seedCustomers() {
        if (customerJpaRepository.count() == 0) {
            customerJpaRepository.saveAll(List.of(
                    new CustomerJpaEntity(null, "Alice Smith", "alice@example.com"),
                    new CustomerJpaEntity(null, "Bob Jones", "bob@example.com"),
                    new CustomerJpaEntity(null, "Carol White", "carol@example.com")
            ));
        }
    }

    private void seedOrders() {
        if (orderJpaRepository.count() == 0) {
            List<CustomerJpaEntity> customers = customerJpaRepository.findAll();
            CustomerJpaEntity alice = customers.stream()
                    .filter(c -> c.getEmail().equals("alice@example.com"))
                    .findFirst().orElseThrow();
            CustomerJpaEntity bob = customers.stream()
                    .filter(c -> c.getEmail().equals("bob@example.com"))
                    .findFirst().orElseThrow();

            OrderJpaEntity order1 = new OrderJpaEntity();
            order1.setStatus(OrderStatus.PENDING);
            order1.setTotal(new BigDecimal("150.00"));
            order1.setCreatedAt(LocalDateTime.now());
            order1.setCustomer(alice);

            OrderJpaEntity order2 = new OrderJpaEntity();
            order2.setStatus(OrderStatus.PROCESSING);
            order2.setTotal(new BigDecimal("320.50"));
            order2.setCreatedAt(LocalDateTime.now().minusDays(1));
            order2.setCustomer(bob);

            orderJpaRepository.saveAll(List.of(order1, order2));
        }
    }
}
