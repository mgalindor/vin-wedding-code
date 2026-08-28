package com.vineyards.deerPlanner.events.domain;

public enum EventStatus {
    draft,
    published,
    archived;

    public boolean canTransitionTo(EventStatus next) {
        if (next == null || this == next) {
            return false;
        }
        return switch (this) {
            case draft -> next == published || next == archived;
            case published -> next == archived;
            case archived -> false;
        };
    }
}
