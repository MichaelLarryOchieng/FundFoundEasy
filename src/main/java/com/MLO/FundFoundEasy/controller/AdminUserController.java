package com.MLO.FundFoundEasy.controller;

import com.MLO.FundFoundEasy.dto.ApiMessage;
import com.MLO.FundFoundEasy.model.Role;
import com.MLO.FundFoundEasy.model.User;
import com.MLO.FundFoundEasy.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> changeRole(@PathVariable Long id, @RequestParam String role) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        try {
            u.setRole(Role.valueOf(role));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiMessage("Invalid role. Use ROLE_USER or ROLE_ADMIN."));
        }
        userRepository.save(u);
        return ResponseEntity.ok(new ApiMessage("Role updated to " + role));
    }
}