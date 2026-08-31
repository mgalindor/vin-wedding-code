package com.vineyards.deerPlanner.shared.web.validators;

import static java.lang.annotation.RetentionPolicy.RUNTIME;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import org.springframework.core.annotation.AliasFor;

/**
 * The annotated attribute must be a valid value of the corresponding "enumClass".
 *
 * <p>{@code null} elements are considered valid only if the "allowNull" flag is set to true.
 *
 * <p>The "ignoreCase" flag indicates if the value will be validated with case/non-case sensitive
 * approach.
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RUNTIME)
@Constraint(validatedBy = EnumerationValidator.class)
public @interface Enumeration {

  String message() default "{valid.enum.invalid}";

  Class<?>[] groups() default {};

  Class<? extends Payload>[] payload() default {};

  @AliasFor("enumClass")
  Class<?> value() default Enum.class;

  @AliasFor("value")
  Class<?> enumClass() default Enum.class;

  boolean ignoreCase() default false;
}
