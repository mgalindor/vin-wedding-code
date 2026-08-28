package com.vineyards.deerPlanner.shared.exceptions;

/**
 * Canonical 404 exception across all bounded contexts. Use {@link #getCode()} as the
 * stable wire-level identifier and {@link #getMessage()} as the human-readable detail.
 *
 * <p>Two construction modes:
 * <pre>
 *   new ResourceNotFoundError("event_not_found")                                  // code-only
 *   new ResourceNotFoundError("event_not_found", "Event " + id + " not found")     // code + message
 * </pre>
 *
 * <p>The global handler in {@code shared/error/GlobalExceptionHandler} maps this to a
 * 404 ProblemDetail with the {@code code} property preserved.
 */
public class ResourceNotFoundError extends RuntimeException {

    private final String code;

    public ResourceNotFoundError(String code) {
        super(code);
        this.code = code;
    }

    public ResourceNotFoundError(String code, String message) {
        super(message);
        this.code = code;
    }

    public ResourceNotFoundError(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public Object[] getDetailMessageArguments() {
        return new Object[0];
    }
}
