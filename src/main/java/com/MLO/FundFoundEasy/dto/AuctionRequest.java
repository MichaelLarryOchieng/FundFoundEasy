package com.MLO.FundFoundEasy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public record AuctionRequest(
        @NotBlank String title,
        String description,
        String imageUrl,
        @NotNull @Positive Double startingPrice,
        Double minIncrement,
        @NotNull LocalDateTime endTime,
        Boolean active
) {}