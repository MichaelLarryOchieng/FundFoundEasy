package com.MLO.FundFoundEasy.repository;

import com.MLO.FundFoundEasy.model.AuctionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuctionItemRepository extends JpaRepository<AuctionItem, Long> {

    List<AuctionItem> findByActiveTrue();
    List<AuctionItem> findByActiveTrueOrderByEndTimeAsc();
    List<AuctionItem> findAllByOrderByEndTimeDesc();

    // ---------- Search ----------
    @Query("""
        SELECT a FROM AuctionItem a
        WHERE a.active = true
          AND (LOWER(a.title)       LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(a.description) LIKE LOWER(CONCAT('%', :q, '%')))
        ORDER BY a.endTime ASC
    """)
    List<AuctionItem> searchActiveAuctions(@Param("q") String query);

    @Modifying
    @Query("UPDATE AuctionItem a SET a.active = false WHERE a.active = true AND a.endTime <= :now")
    int markExpiredAuctionsInactive(@Param("now") LocalDateTime now);
}