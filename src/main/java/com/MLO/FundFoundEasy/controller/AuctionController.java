package com.MLO.FundFoundEasy.controller;

import com.MLO.FundFoundEasy.dto.BidRequest;
import com.MLO.FundFoundEasy.model.AuctionItem;
import com.MLO.FundFoundEasy.model.Bid;
import com.MLO.FundFoundEasy.service.AuctionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    // ---------- PUBLIC ----------

    @GetMapping
    public ResponseEntity<List<AuctionItem>> getActiveAuctions(
            @RequestParam(value = "q", required = false) String query) {
        if (query != null && !query.isBlank()) {
            return ResponseEntity.ok(auctionService.searchAuctions(query));
        }
        return ResponseEntity.ok(auctionService.getActiveAuctions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuctionItem> getAuction(@PathVariable Long id) {
        return ResponseEntity.ok(auctionService.getAuction(id));
    }

    @GetMapping("/{id}/bids")
    public ResponseEntity<List<Bid>> getBidHistory(@PathVariable Long id) {
        return ResponseEntity.ok(auctionService.getBidHistory(id));
    }
    @PostMapping("/bid")
    public ResponseEntity<Bid> placeBid(@Valid @RequestBody BidRequest req,
                                        Authentication auth) {
        return ResponseEntity.ok(auctionService.placeBid(req, auth.getName()));
    }
}