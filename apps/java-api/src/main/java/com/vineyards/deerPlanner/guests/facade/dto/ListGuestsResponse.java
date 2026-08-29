package com.vineyards.deerPlanner.guests.facade.dto;

import java.util.List;

public record ListGuestsResponse(List<GuestDto> items, int total) {}
