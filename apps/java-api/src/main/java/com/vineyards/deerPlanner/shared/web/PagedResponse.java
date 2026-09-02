package com.vineyards.deerPlanner.shared.web;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Generic envelope for paginated list responses. Centralised here so every list endpoint shares one
 * shape — clients can write one type and reuse it across the API.
 *
 * <p>{@code hasMore} is a convenience derived from the page data; clients that prefer the {@code
 * totalPages} / {@code page} pair can use those instead.
 */
public record PagedResponse<T>(
    List<T> items, int page, int size, long total, int totalPages, boolean hasMore) {

  public static <S, T> PagedResponse<T> from(
      Page<S> page, java.util.function.Function<S, T> mapper) {
    List<T> items = page.getContent().stream().map(mapper).toList();
    return new PagedResponse<>(
        items,
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.hasNext());
  }
}
