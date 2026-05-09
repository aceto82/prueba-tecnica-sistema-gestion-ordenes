package com.oms.application.service;

import com.oms.domain.exception.DuplicateUsernameException;
import com.oms.domain.model.Role;
import com.oms.domain.model.User;
import com.oms.domain.port.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
    }

    public User create(String username, String password, Role role) {
        if (userRepository.existsByUsername(username)) {
            throw new DuplicateUsernameException(username);
        }
        String hashedPassword = passwordEncoder.encode(password);
        User user = User.create(username, hashedPassword, role);
        return userRepository.save(user);
    }

    public User update(Long id, String username, Role role) {
        User user = getById(id);
        if (userRepository.existsByUsernameAndIdNot(username, id)) {
            throw new DuplicateUsernameException(username);
        }
        user.setUsername(username);
        user.setRole(role);
        return userRepository.save(user);
    }

    public void delete(Long id) {
        if (!userRepository.findById(id).isPresent()) {
            throw new EntityNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }
}
