package com.MLO.FundFoundEasy.service;

import com.MLO.FundFoundEasy.dto.AuctionRequest;
import com.MLO.FundFoundEasy.dto.BidRequest;
import com.MLO.FundFoundEasy.model.AuctionItem;
import com.MLO.FundFoundEasy.model.Bid;
import com.MLO.FundFoundEasy.repository.AuctionItemRepository;
import com.MLO.FundFoundEasy.repository.BidRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuctionService {

    private static final Logger log = LoggerFactory.getLogger(AuctionService.class);

    private final AuctionItemRepository auctionItemRepository;
    private final BidRepository bidRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AuctionService(AuctionItemRepository auctionItemRepository,
                          BidRepository bidRepository,
                          SimpMessagingTemplate messagingTemplate) {
        this.auctionItemRepository = auctionItemRepository;
        this.bidRepository = bidRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // ---------------- READ ----------------

    @Cacheable(value = "active_auctions")
    @Transactional(readOnly = true)
    public List<AuctionItem> getActiveAuctions() {
        return auctionItemRepository.findByActiveTrueOrderByEndTimeAsc();
    }

    @Transactional(readOnly = true)
    public List<AuctionItem> searchAuctions(String query) {
        if (query == null || query.isBlank()) {
            return getActiveAuctions();
        }
        return auctionItemRepository.searchActiveAuctions(query.trim());
    }

    @Transactional(readOnly = true)
    public List<AuctionItem> getAllAuctions() {
        return auctionItemRepository.findAllByOrderByEndTimeDesc();
    }

    @Transactional(readOnly = true)
    public AuctionItem getAuction(Long id) {
        return auctionItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<Bid> getBidHistory(Long auctionId) {
        return bidRepository.findByAuctionItemItemIdOrderByTimestampDesc(auctionId);
    }

    // ---------------- BID ----------------

    @Retryable(
            retryFor = { OptimisticLockingFailureException.class },
            maxAttempts = 3,
            backoff = @Backoff(delay = 100)
    )
    @CacheEvict(value = "active_auctions", allEntries = true)
    @Transactional
    public Bid placeBid(BidRequest req, String bidderUsername) {
        Long auctionId = req.itemId();
        Double maxBidAmount = req.bidAmount();

        AuctionItem auction = auctionItemRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found: " + auctionId));

        if (!auction.isActive() || LocalDateTime.now().isAfter(auction.getEndTime())) {
            throw new IllegalStateException("Auction is inactive or has ended.");
        }
        if (bidderUsername.equalsIgnoreCase(auction.getSellerUsername())) {
            throw new IllegalArgumentException("Sellers cannot bid on their own listing.");
        }
        if (bidderUsername.equalsIgnoreCase(auction.getHighestBidder())) {
            throw new IllegalArgumentException("You are already the highest bidder.");
        }

        double baseline = (auction.getCurrentBid() != null && auction.getCurrentBid() > 0)
                ? auction.getCurrentBid()
                : (auction.getStartingPrice() != null ? auction.getStartingPrice() : 0.0);

        double minimumRequired = baseline + auction.getMinIncrement();
        if (maxBidAmount < minimumRequired) {
            throw new IllegalArgumentException(
                    String.format("Bid must be at least $%.2f", minimumRequired));
        }

        LocalDateTime now = LocalDateTime.now();
        if (auction.getEndTime().minusMinutes(2).isBefore(now)) {
            auction.setEndTime(auction.getEndTime().plusMinutes(3));
            log.info("Anti-sniping: extended auction {} to {}", auctionId, auction.getEndTime());
        }

        Double currentLeaderMax = auction.getMaxProxyBid() != null
                ? auction.getMaxProxyBid() : baseline;
        String currentLeader = auction.getHighestBidder();
        Bid recordedBid;

        if (currentLeader == null) {
            double firstPrice = Math.max(baseline, minimumRequired);
            firstPrice = Math.min(firstPrice, maxBidAmount);
            auction.setCurrentBid(firstPrice);
            auction.setHighestBidder(bidderUsername);
            auction.setMaxProxyBid(maxBidAmount);
            recordedBid = new Bid(firstPrice, bidderUsername, now, auction);

        } else if (maxBidAmount > currentLeaderMax) {
            bidRepository.save(new Bid(currentLeaderMax, currentLeader, now, auction));
            double newCurrentBid = Math.min(maxBidAmount,
                    currentLeaderMax + auction.getMinIncrement());
            auction.setCurrentBid(newCurrentBid);
            auction.setHighestBidder(bidderUsername);
            auction.setMaxProxyBid(maxBidAmount);
            recordedBid = new Bid(newCurrentBid, bidderUsername, now, auction);

        } else {
            double newCurrentBid = Math.min(currentLeaderMax,
                    maxBidAmount + auction.getMinIncrement());
            auction.setCurrentBid(newCurrentBid);
            bidRepository.save(new Bid(maxBidAmount, bidderUsername, now, auction));
            recordedBid = new Bid(newCurrentBid, currentLeader, now, auction);
        }

        bidRepository.save(recordedBid);
        auctionItemRepository.save(auction);
        messagingTemplate.convertAndSend("/topic/auction/" + auctionId, auction);

        return recordedBid;
    }

    // ---------------- ADMIN CRUD ----------------

    @CacheEvict(value = "active_auctions", allEntries = true)
    @Transactional
    public AuctionItem createAuction(AuctionRequest req, String sellerUsername) {
        AuctionItem a = new AuctionItem();
        a.setTitle(req.title());
        a.setDescription(req.description());
        a.setImageUrl(req.imageUrl());
        a.setStartingPrice(req.startingPrice());
        a.setCurrentBid(req.startingPrice());
        a.setMinIncrement(req.minIncrement() != null ? req.minIncrement() : 1.0);
        a.setEndTime(req.endTime());
        a.setSellerUsername(sellerUsername);
        a.setActive(req.active() != null ? req.active() : true);
        a.setHighestBidder(null);

        AuctionItem saved = auctionItemRepository.save(a);
        messagingTemplate.convertAndSend("/topic/auction/new", saved);
        return saved;
    }

    @CacheEvict(value = "active_auctions", allEntries = true)
    @Transactional
    public AuctionItem updateAuction(Long id, AuctionRequest req) {
        AuctionItem a = auctionItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found: " + id));

        if (req.title() != null)        a.setTitle(req.title());
        if (req.description() != null)  a.setDescription(req.description());
        if (req.imageUrl() != null)     a.setImageUrl(req.imageUrl());
        if (req.minIncrement() != null) a.setMinIncrement(req.minIncrement());
        if (req.endTime() != null)      a.setEndTime(req.endTime());
        if (req.active() != null)       a.setActive(req.active());

        AuctionItem saved = auctionItemRepository.save(a);
        messagingTemplate.convertAndSend("/topic/auction/" + id, saved);
        return saved;
    }

    @CacheEvict(value = "active_auctions", allEntries = true)
    @Transactional
    public void deleteAuction(Long id) {
        if (!auctionItemRepository.existsById(id)) {
            throw new IllegalArgumentException("Auction not found: " + id);
        }
        auctionItemRepository.deleteById(id);
        messagingTemplate.convertAndSend("/topic/auction/deleted", id);
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    @CacheEvict(value = "active_auctions", allEntries = true)
    public void processExpiredAuctions() {
        int n = auctionItemRepository.markExpiredAuctionsInactive(LocalDateTime.now());
        if (n > 0) log.info("Auto-expired {} auction(s)", n);
    }
}