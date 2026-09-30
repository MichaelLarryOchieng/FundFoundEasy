package com.MLO.FundFoundEasy.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BidRequest(
        @NotNull Long itemId,
        @NotNull @Positive Double bidAmount
) {}