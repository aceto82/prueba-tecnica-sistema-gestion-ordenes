package com.oms.domain.exception;

public class DuplicateUsernameException extends RuntimeException {

    public DuplicateUsernameException(String username) {
        super("User with username " + username + " already exists");
    }
}
