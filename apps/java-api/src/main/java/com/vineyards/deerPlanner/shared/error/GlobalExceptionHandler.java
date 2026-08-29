package com.vineyards.deerPlanner.shared.error;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.vineyards.deerPlanner.shared.exceptions.BusinessError;
import com.vineyards.deerPlanner.shared.exceptions.InvalidCredentialsException;
import com.vineyards.deerPlanner.shared.exceptions.ResourceNotFoundError;
import com.vineyards.deerPlanner.shared.exceptions.UserNotFoundException;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.lang.Nullable;
import org.springframework.util.CollectionUtils;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

  public static final String LOCATION_FIELD = "location";

  public static final String HTTP_MESSAGE_NOT_READABLE = "http.message.not.readable.exception";
  public static final String INVALID_FORMAT = "invalid.format.exception";
  public static final String JSON_MAPPING = "json.mapping.exception";
  public static final String JSON_PARSE = "json.parse.exception";
  public static final String METHOD_ARGUMENT_NOT_VALID = "method.argument.not.valid.exception";
  public static final String CONSTRAINT_VIOLATION = "constraint.violation.exception";
  public static final String METHOD_VALIDATION = "handler.method.validation.exception";

  public record LocationError(String field, String message) {}

  @ExceptionHandler(ConstraintViolationException.class)
  @Nullable
  protected final ResponseEntity<Object> handleConstraintViolation(
      ConstraintViolationException ex, WebRequest request) {
    ProblemDetail body =
        createProblemDetail(
            ex,
            HttpStatus.BAD_REQUEST,
            "Request validation error",
            CONSTRAINT_VIOLATION,
            null,
            request);
    List<LocationError> details =
        ex.getConstraintViolations().stream()
            .map(v -> new LocationError(v.getPropertyPath().toString(), v.getMessage()))
            .collect(Collectors.toList());
    body.setProperty(LOCATION_FIELD, details);
    return handleExceptionInternal(ex, body, new HttpHeaders(), HttpStatus.BAD_REQUEST, request);
  }

  @Nullable
  @Override
  protected ResponseEntity<Object> handleHandlerMethodValidationException(
      HandlerMethodValidationException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    ProblemDetail body =
        createProblemDetail(ex, status, "Validation error", METHOD_VALIDATION, null, request);
    List<LocationError> details =
        ex.getParameterValidationResults().stream()
            .flatMap(
                parameterError ->
                    parameterError.getResolvableErrors().stream()
                        .map(
                            resolvable -> {
                              String field = parameterError.getMethodParameter().getParameterName();
                              if (resolvable instanceof FieldError fe) {
                                field = fe.getField();
                              } else if (resolvable instanceof ObjectError oe) {
                                field = oe.getObjectName();
                              }
                              return new LocationError(field, resolvable.getDefaultMessage());
                            }))
            .collect(Collectors.toList());
    body.setProperty(LOCATION_FIELD, details);
    return handleExceptionInternal(ex, body, headers, status, request);
  }

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    ProblemDetail body =
        createProblemDetail(
            ex, status, "Validation error", METHOD_ARGUMENT_NOT_VALID, null, request);
    List<LocationError> details =
        ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> new LocationError(fe.getField(), fe.getDefaultMessage()))
            .collect(Collectors.toList());
    body.setProperty(LOCATION_FIELD, details);
    return handleExceptionInternal(ex, body, headers, status, request);
  }

  @Nullable
  @Override
  protected ResponseEntity<Object> handleHttpMessageNotReadable(
      HttpMessageNotReadableException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    String messageCode = HTTP_MESSAGE_NOT_READABLE;
    Object[] args = null;
    Throwable cause = ex.getCause();
    if (cause != null) {
      log.info(
          "HttpMessageNotReadableException cause:[{}] message:[{}]",
          cause.getClass().getName(),
          cause.getMessage());
      if (cause instanceof InvalidFormatException ife) {
        messageCode = INVALID_FORMAT;
        args =
            new Object[] {
              getPath(ife.getPath()), ife.getLocation().getLineNr(), ife.getLocation().getColumnNr()
            };
      } else if (cause instanceof JsonMappingException jme) {
        messageCode = JSON_MAPPING;
        args =
            new Object[] {
              getPath(jme.getPath()), jme.getLocation().getLineNr(), jme.getLocation().getColumnNr()
            };
      } else if (cause instanceof JsonParseException jpe) {
        messageCode = JSON_PARSE;
        args = new Object[] {jpe.getLocation().getLineNr(), jpe.getLocation().getColumnNr()};
      }
    }
    ProblemDetail body =
        createProblemDetail(ex, status, "Failed to read request", messageCode, args, request);
    return handleExceptionInternal(ex, body, headers, status, request);
  }

  protected String getPath(List<JsonMappingException.Reference> references) {
    if (CollectionUtils.isEmpty(references)) {
      return "";
    }
    return references.stream()
        .map(ref -> ref.getIndex() != -1 ? "[" + ref.getIndex() + "]" : "." + ref.getFieldName())
        .collect(Collectors.joining())
        .substring(1);
  }

  @ExceptionHandler(BusinessError.class)
  protected ProblemDetail onBusinessError(BusinessError ex, WebRequest request) {
    return createProblemDetail(
        ex,
        HttpStatus.UNPROCESSABLE_ENTITY,
        ex.getMessage(),
        ex.getMessage(),
        ex.getDetailMessageArguments(),
        request);
  }

  @ExceptionHandler(ResourceNotFoundError.class)
  protected ProblemDetail onResourceNotFound(ResourceNotFoundError ex, WebRequest request) {
    ProblemDetail body = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    body.setTitle("Resource not found");
    body.setProperty("code", ex.getCode());
    return body;
  }

  @ExceptionHandler(InvalidCredentialsException.class)
  protected ProblemDetail onInvalidCredentials(InvalidCredentialsException ex, WebRequest request) {
    return createProblemDetail(
        ex, HttpStatus.UNAUTHORIZED, "invalid_grant", "invalid_grant", null, request);
  }

  @ExceptionHandler(UserNotFoundException.class)
  protected ProblemDetail onUserNotFound(UserNotFoundException ex, WebRequest request) {
    return createProblemDetail(
        ex, HttpStatus.NOT_FOUND, "user_not_found", "user_not_found", null, request);
  }

  @ExceptionHandler(Exception.class)
  protected ProblemDetail onUnhandled(Exception ex, WebRequest request) {
    log.error("Unhandled error", ex);
    return createProblemDetail(
        ex, HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", null, null, request);
  }
}
