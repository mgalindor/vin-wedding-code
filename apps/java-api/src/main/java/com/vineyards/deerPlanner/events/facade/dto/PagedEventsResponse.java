package com.vineyards.deerPlanner.events.facade.dto;

import com.vineyards.deerPlanner.shared.web.PagedResponse;

/** Convenience alias so callers don't have to spell out the generic parameter type. */
public record PagedEventsResponse(PagedResponse<EventSummaryDto> page) {}
