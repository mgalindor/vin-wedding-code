package com.vineyards.deerPlanner.events.domain;

public enum EventType {
  wedding,
  birthday,
  anniversary,
  other;

  public static EventType fromString(String value) {
    if (value == null) {
      throw new IllegalArgumentException("eventType is required");
    }
    for (EventType t : values()) {
      if (t.name().equals(value)) {
        return t;
      }
    }
    throw new IllegalArgumentException("Unknown eventType: " + value);
  }
}
