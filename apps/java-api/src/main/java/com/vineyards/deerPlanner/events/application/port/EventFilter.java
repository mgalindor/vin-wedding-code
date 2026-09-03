package com.vineyards.deerPlanner.events.application.port;

import java.time.LocalDate;

/**
 * Technology-agnostic filter for the event search port. Lives in {@code application.port} so the
 * service layer can pass it without leaking JPA types (Specification, CriteriaBuilder, ...) across
 * the application/adapter boundary.
 *
 * <p>Semantics:
 *
 * <ul>
 *   <li>{@code organizerId} — when non-null, restricts to events owned by this user. Pass {@code
 *       null} for admin scope (no ownership filter).
 *   <li>{@code q}, {@code status}, {@code eventType}, {@code eventDateFrom}, {@code eventDateTo} —
 *       all optional. Blank / null values are ignored by the adapter.
 * </ul>
 */
public record EventFilter(
    String organizerId,
    String q,
    String status,
    String eventType,
    LocalDate eventDateFrom,
    LocalDate eventDateTo) {

  public static EventFilter unscoped(
      String q, String status, String eventType, LocalDate eventDateFrom, LocalDate eventDateTo) {
    return new EventFilter(null, q, status, eventType, eventDateFrom, eventDateTo);
  }

  public static EventFilter forOrganizer(
      String organizerId,
      String q,
      String status,
      String eventType,
      LocalDate eventDateFrom,
      LocalDate eventDateTo) {
    return new EventFilter(organizerId, q, status, eventType, eventDateFrom, eventDateTo);
  }
}
