package com.praveen.findit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.praveen.findit.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // Login ke waqt email se user dhundhne ke liye
    Optional<User> findByEmail(String email);

    // Register ke waqt check: ye email pehle se hai ya nahi
    boolean existsByEmail(String email);
}