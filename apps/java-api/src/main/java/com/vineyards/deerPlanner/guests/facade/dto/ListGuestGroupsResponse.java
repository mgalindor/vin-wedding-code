package com.vineyards.deerPlanner.guests.facade.dto;

import java.util.List;

public record ListGuestGroupsResponse(List<GuestGroupDto> items, int total) {}
