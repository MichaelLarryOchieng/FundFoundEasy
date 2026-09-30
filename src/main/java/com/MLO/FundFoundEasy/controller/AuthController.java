package com.MLO.FundFoundEasy.controller;

import com.MLO.FundFoundEasy.dto.*;
import com.MLO.FundFoundEasy.model.Role;
import com.MLO.FundFoundEasy.model.User;
import com.MLO.FundFoundEasy.repository.UserRepository;
import com.MLO.FundFoundEasy.security.JwtUtils;
import com.MLO.FundFoundEasy.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Value("${app.auth.auto-verify:false}")
    private boolean autoVerify;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          EmailService emailService,
                          AuthenticationManager authenticationManager,
                          JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
    }

    // ---------- Register ----------
    @PostMapping("/register")
    public ResponseEntity<ApiMessage> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.username()))
            return ResponseEntity.badRequest().body(new ApiMessage("Username is already taken."));
        if (userRepository.existsByEmail(req.email()))
            return ResponseEntity.badRequest().body(new ApiMessage("Email is already in use."));

        User u = new User();
        u.setUsername(req.username());
        u.setEmail(req.email());
        u.setPassword(passwordEncoder.encode(req.password()));
        u.setRole(Role.ROLE_USER);

        if (autoVerify) {
            u.setEnabled(true);
            u.setVerificationToken(null);
            userRepository.save(u);
            return ResponseEntity.ok(new ApiMessage("Registered successfully! You can now log in."));
        }

        u.setEnabled(false);
        String token = UUID.randomUUID().toString();
        u.setVerificationToken(token);
        userRepository.save(u);
        emailService.sendVerificationEmail(u.getEmail(), token);
        return ResponseEntity.ok(new ApiMessage(
                "Registered successfully! Please check your email to verify your account."));
    }

    // ---------- Verify ----------
    @GetMapping("/verify")
    public ResponseEntity<ApiMessage> verify(@RequestParam("token") String token) {
        User user = userRepository.findByVerificationToken(token).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiMessage("Invalid or expired verification token."));
        }
        user.setEnabled(true);
        user.setVerificationToken(null);
        userRepository.save(user);
        return ResponseEntity.ok(new ApiMessage("Account verified successfully! You can now log in."));
    }

    // ---------- Login ----------
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.username(), req.password()));

        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User vanished after auth"));

        String jwt = jwtUtils.generateToken(user.getUsername(), user.getRole().name());
        return ResponseEntity.ok(new JwtResponse(
                jwt, user.getUsername(), user.getEmail(), user.getRole().name()));
    }

    // ---------- Me ----------
    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(new ApiMessage("Not authenticated."));
        }
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(401).body(new ApiMessage("User not found."));
        }
        return ResponseEntity.ok(new JwtResponse(
                null, user.getUsername(), user.getEmail(), user.getRole().name()));
    }

    // ---------- Forgot Password ----------
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiMessage> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        // Always return 200 — don't leak whether the email exists.
        userRepository.findByEmail(req.email()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setPasswordResetToken(token);
            user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(30));
            userRepository.save(user);
            emailService.sendPasswordResetEmail(user.getEmail(), token);
        });

        return ResponseEntity.ok(new ApiMessage(
                "If that email exists in our system, a reset link has been sent."));
    }

    // ---------- Reset Password ----------
    @PostMapping("/reset-password")
    public ResponseEntity<ApiMessage> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        User user = userRepository.findByPasswordResetToken(req.token())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token."));

        if (user.getPasswordResetExpiresAt() == null
                || user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset token has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(req.newPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);

        return ResponseEntity.ok(new ApiMessage(
                "Password reset successfully! You can now log in with your new password."));
    }
}