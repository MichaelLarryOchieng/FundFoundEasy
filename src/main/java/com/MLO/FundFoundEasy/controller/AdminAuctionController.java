package com.MLO.FundFoundEasy.controller;

import com.MLO.FundFoundEasy.dto.AuctionRequest;
import com.MLO.FundFoundEasy.model.AuctionItem;
import com.MLO.FundFoundEasy.service.AuctionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/auctions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuctionController {

    private final AuctionService auctionService;

    public AdminAuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    @GetMapping
    public ResponseEntity<List<AuctionItem>> getAllAuctions() {
        return ResponseEntity.ok(auctionService.getAllAuctions());
    }

    @PostMapping
    public ResponseEntity<AuctionItem> createAuction(@Valid @RequestBody AuctionRequest req,
                                                     Authentication auth) {
        AuctionItem saved = auctionService.createAuction(req, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AuctionItem> updateAuction(@PathVariable Long id,
                                                     @Valid @RequestBody AuctionRequest req) {
        return ResponseEntity.ok(auctionService.updateAuction(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAuction(@PathVariable Long id) {
        auctionService.deleteAuction(id);
        return ResponseEntity.noContent().build();
    }
}