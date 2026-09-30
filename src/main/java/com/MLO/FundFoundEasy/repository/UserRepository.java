package com.MLO.FundFoundEasy.repository;

import com.MLO.FundFoundEasy.model.Role;
import com.MLO.FundFoundEasy.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String verificationToken);
    Optional<User> findByPasswordResetToken(String passwordResetToken);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    long countByRole(Role role);
}