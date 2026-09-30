package com.MLO.FundFoundEasy.controller;

import com.MLO.FundFoundEasy.dto.ApiMessage;
import com.MLO.FundFoundEasy.dto.ChangePasswordRequest;
import com.MLO.FundFoundEasy.dto.JwtResponse;
import com.MLO.FundFoundEasy.dto.UpdateProfileRequest;
import com.MLO.FundFoundEasy.model.AuctionItem;
import com.MLO.FundFoundEasy.model.User;
import com.MLO.FundFoundEasy.repository.AuctionItemRepository;
import com.MLO.FundFoundEasy.repository.BidRepository;
import com.MLO.FundFoundEasy.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final AuctionItemRepository auctionItemRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository,
                          BidRepository bidRepository,
                          AuctionItemRepository auctionItemRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.bidRepository = bidRepository;
        this.auctionItemRepository = auctionItemRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ---------- Profile: read ----------
    @GetMapping("/profile")
    public ResponseEntity<?> profile(Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(new ApiMessage("Not authenticated."));
        return ResponseEntity.ok(new JwtResponse(
                null, user.getUsername(), user.getEmail(), user.getRole().name()));
    }

    // ---------- Profile: update email ----------
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest req,
                                           Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(new ApiMessage("Not authenticated."));

        if (!user.getEmail().equalsIgnoreCase(req.email())
                && userRepository.existsByEmail(req.email())) {
            return ResponseEntity.badRequest().body(new ApiMessage("Email already in use."));
        }
        user.setEmail(req.email());
        userRepository.save(user);
        return ResponseEntity.ok(new ApiMessage("Profile updated."));
    }

    // ---------- Profile: change password ----------
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest req,
                                            Authentication auth) {
        User user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(new ApiMessage("Not authenticated."));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(new ApiMessage("Current password is incorrect."));
        }
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(new ApiMessage("Password changed successfully."));
    }

    // ---------- My Bids ----------
    @GetMapping("/my-bids")
    public ResponseEntity<?> myBids(Authentication auth) {
        String username = auth.getName();
        LocalDateTime now = LocalDateTime.now();

        // All auctions where this user has bid
        List<AuctionItem> allItems = auctionItemRepository.findAll();

        List<Map<String, Object>> winning = new java.util.ArrayList<>();
        List<Map<String, Object>> outbid = new java.util.ArrayList<>();
        List<Map<String, Object>> won = new java.util.ArrayList<>();
        List<Map<String, Object>> lost = new java.util.ArrayList<>();

        for (AuctionItem item : allItems) {
            boolean userIsLeader = username.equalsIgnoreCase(item.getHighestBidder());
            boolean userHasBid = bidRepository.findByAuctionItemItemIdOrderByTimestampDesc(item.getItemId())
                    .stream().anyMatch(b -> username.equalsIgnoreCase(b.getBidderUsername()));

            if (!userHasBid && !userIsLeader) continue;

            boolean ended = !item.isActive() || now.isAfter(item.getEndTime());

            Map<String, Object> summary = new HashMap<>();
            summary.put("itemId", item.getItemId());
            summary.put("title", item.getTitle());
            summary.put("description", item.getDescription());
            summary.put("imageUrl", item.getImageUrl());
            summary.put("currentBid", item.getCurrentBid());
            summary.put("highestBidder", item.getHighestBidder());
            summary.put("endTime", item.getEndTime());
            summary.put("active", item.isActive());

            if (ended) {
                if (userIsLeader) won.add(summary);
                else              lost.add(summary);
            } else {
                if (userIsLeader) winning.add(summary);
                else              outbid.add(summary);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("winning", winning);
        result.put("outbid",  outbid);
        result.put("won",     won);
        result.put("lost",    lost);
        return ResponseEntity.ok(result);
    }
}