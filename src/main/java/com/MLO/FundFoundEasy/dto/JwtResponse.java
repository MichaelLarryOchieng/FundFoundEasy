package com.MLO.FundFoundEasy.dto;

public record JwtResponse(String token, String username, String email, String role) {}