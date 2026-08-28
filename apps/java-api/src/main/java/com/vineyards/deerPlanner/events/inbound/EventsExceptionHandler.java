package com.vineyards.deerPlanner.events.inbound;

import com.vineyards.deerPlanner.events.domain.EventNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * Module-local exception handler. Lives in {@code events/inbound/} so the {@code shared}
 * module does not have to know about event-specific types — Spring Modulith forbids a reverse
 * dependency from a shared module to a bounded context.
 */
@RestControllerAdvice
public class EventsExceptionHandler {

    @ExceptionHandler(EventNotFoundException.class)
    protected ProblemDetail onEventNotFound(EventNotFoundException ex, WebRequest request) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND,
            ex.getMessage()
        );
        body.setTitle("Event not found");
        body.setProperty("code", "event_not_found");
        return body;
    }
}
