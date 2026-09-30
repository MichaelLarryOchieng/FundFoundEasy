package com.MLO.FundFoundEasy.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${app.mail.from:noreply@fundfounded.com}")
    private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ---------- Verification (existing) ----------
    public void sendVerificationEmail(String toEmail, String token) {
        String link = baseUrl + "/api/auth/verify?token=" + token;
        String subject = "FundFoundEasy — Verify Your Account";
        String body = "Welcome to FundFoundEasy!\n\n"
                + "Click the link below to verify your account:\n"
                + link;

        sendOrLog(toEmail, subject, body, link);
    }

    // ---------- Password Reset (new) ----------
    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = baseUrl + "/#/reset-password?token=" + token;
        String subject = "FundFoundEasy — Password Reset";
        String body = "We received a request to reset your password.\n\n"
                + "Click the link below to set a new password:\n"
                + link
                + "\n\nThis link expires in 30 minutes. If you didn't request a reset, ignore this email.";

        sendOrLog(toEmail, subject, body, link);
    }

    // ---------- Shared logic ----------
    private void sendOrLog(String toEmail, String subject, String body, String link) {
        if (mailHost == null || mailHost.isBlank()) {
            log.warn("=== DEV EMAIL (no SMTP configured) ===");
            log.warn("To: {}", toEmail);
            log.warn("Subject: {}", subject);
            log.warn("Link: {}", link);
            log.warn("========================================");
            return;
        }

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Email sent to {} ({})", toEmail, subject);
        } catch (Exception e) {
            log.error("Failed to send email to " + toEmail + ": " + e.getMessage(), e);
            log.warn("Link (fallback): {}", link);
        }
    }
}