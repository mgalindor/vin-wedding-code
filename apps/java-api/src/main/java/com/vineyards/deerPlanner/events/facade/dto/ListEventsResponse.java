package com.vineyards.deerPlanner.events.facade.dto;

import java.util.List;

/**
 * List responses are always wrapped at the root ({@code { items, total, hasMore }}). Direct
 * array responses are not used anywhere in the API.
 */
public record ListEventsResponse(
    List<EventSummaryDto> items,
    int total,
    boolean hasMore
) {
}
