package com.oms.domain.port;

import com.oms.domain.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface UserRepository {

    Optional<User> findByUsername(String username);

    User save(User user);

    Optional<User> findById(Long id);

    Page<User> findAll(Pageable pageable);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndIdNot(String username, Long id);

    void deleteById(Long id);
}
