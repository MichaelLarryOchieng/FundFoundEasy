package com.MLO.FundFoundEasy.config;

import com.MLO.FundFoundEasy.model.Role;
import com.MLO.FundFoundEasy.model.User;
import com.MLO.FundFoundEasy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Runs once on application startup.
 * If no ROLE_ADMIN user exists, seeds a default admin so the app is usable.
 */
@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${app.admin.email:admin@fundfounded.com}")
    private String adminEmail;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        long adminCount = userRepository.countByRole(Role.ROLE_ADMIN);

        if (adminCount > 0) {
            log.info("DataSeeder: {} admin user(s) already exist — skipping seed.", adminCount);
            return;
        }

        // If the username is already taken by a non-admin, promote that user instead.
        User existing = userRepository.findByUsername(adminUsername).orElse(null);

        if (existing != null) {
            existing.setRole(Role.ROLE_ADMIN);
            existing.setEnabled(true);
            existing.setVerificationToken(null);
            // Don't overwrite their password — they may have set one already
            userRepository.save(existing);
            log.info("DataSeeder: promoted existing user '{}' to ROLE_ADMIN.", adminUsername);
            return;
        }

        // Otherwise create a fresh admin
        User admin = new User();
        admin.setUsername(adminUsername);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ROLE_ADMIN);
        admin.setEnabled(true);
        admin.setVerificationToken(null);

        userRepository.save(admin);

        log.info("========================================================");
        log.info("  DataSeeder: admin user created");
        log.info("     username: {}", adminUsername);
        log.info("     password: {}", adminPassword);
        log.info("     email:    {}", adminEmail);
        log.info("  ⚠  Change this password after first login.");
        log.info("========================================================");
    }
}