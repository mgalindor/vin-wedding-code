package com.vineyards.deerPlanner.guests.facade.dto;

import com.vineyards.deerPlanner.shared.web.PagedResponse;

public record PagedGuestsResponse(PagedResponse<GuestDto> page) {}
