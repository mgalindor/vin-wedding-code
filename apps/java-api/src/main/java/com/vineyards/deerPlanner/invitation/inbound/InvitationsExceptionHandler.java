package com.vineyards.deerPlanner.invitation.inbound;

import com.vineyards.deerPlanner.invitation.domain.InvitationNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * Module-local exception handler — keeps {@code shared/error/} free of invitation-specific
 * types per Spring Modulith boundary rules.
 */
@RestControllerAdvice
public class InvitationsExceptionHandler {

    @ExceptionHandler(InvitationNotFoundException.class)
    protected ProblemDetail onInvitationNotFound(InvitationNotFoundException ex, WebRequest request) {
        ProblemDetail body = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND,
            ex.getMessage()
        );
        body.setTitle("Invitation not found");
        body.setProperty("code", "invitation_not_found");
        return body;
    }
}
