package com.vineyards.deerPlanner.guests.inbound;

import com.vineyards.deerPlanner.guests.domain.GuestGroupNotFoundException;
import com.vineyards.deerPlanner.guests.domain.GuestNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * Module-local exception handler — keeps {@code shared/error/} free of guest-specific types
 * per Spring Modulith boundary rules.
 */
@RestControllerAdvice
public class GuestsExceptionHandler {

    @ExceptionHandler(GuestGroupNotFoundException.class)
    protected ProblemDetail onGuestGroupNotFound(GuestGroupNotFoundException ex, WebRequest request) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage()
        );
        body.setTitle("Guest group not found");
        body.setProperty("code", "guest_group_not_found");
        return body;
    }

    @ExceptionHandler(GuestNotFoundException.class)
    protected ProblemDetail onGuestNotFound(GuestNotFoundException ex, WebRequest request) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage()
        );
        body.setTitle("Guest not found");
        body.setProperty("code", "guest_not_found");
        return body;
    }
}
