package com.oms.domain.model;

import java.time.Instant;
import java.util.Objects;

public class User {

    private Long id;
    private String username;
    private String password;
    private Role role;
    private Instant createdAt;

    User(Long id, String username, String password, Role role, Instant createdAt) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
        this.createdAt = createdAt;
    }

    public static User create(String username, String password, Role role) {
        return new User(null, username, password, role, Instant.now());
    }

    public static User rehydrate(Long id, String username, String password, Role role) {
        return new User(id, username, password, role, Instant.now());
    }

    public static User rehydrate(Long id, String username, String password, Role role, Instant createdAt) {
        return new User(id, username, password, role, createdAt);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User user)) return false;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return "User{id=" + id + ", username='" + username + "', role=" + role + ", createdAt=" + createdAt + "}";
    }
}
