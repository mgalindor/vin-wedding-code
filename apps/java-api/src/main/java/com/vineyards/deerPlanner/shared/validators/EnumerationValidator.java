package com.vineyards.deerPlanner.shared.validators;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.hibernate.validator.constraintvalidation.HibernateConstraintValidatorContext;

public class EnumerationValidator implements ConstraintValidator<Enumeration, String> {

    private Class<?> enumClass;

    private boolean ignoreCase;

    private String message;

    @Override
    public void initialize(Enumeration constraintAnnotation) {
        this.enumClass =
            constraintAnnotation.enumClass().getEnumConstants() != null
                ? constraintAnnotation.enumClass()
                : constraintAnnotation.value();
        this.ignoreCase = constraintAnnotation.ignoreCase();
        this.message = constraintAnnotation.message();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        Object[] enumValues = enumClass.getEnumConstants();

        if (enumValues == null) {
            return false;
        }

        boolean valid =
            Arrays.stream(enumValues)
                .anyMatch(
                    enumValue ->
                        value.equals(enumValue.toString())
                            || (ignoreCase && value.equalsIgnoreCase(enumValue.toString())));

        if (!valid) {

            String allowedValues = getAllowedValues();

            HibernateConstraintValidatorContext hibernateContext =
                context.unwrap(HibernateConstraintValidatorContext.class);
            hibernateContext.disableDefaultConstraintViolation();
            hibernateContext
                .addMessageParameter("allowedValues", allowedValues)
                .buildConstraintViolationWithTemplate(message)
                .addConstraintViolation();
        }

        return valid;
    }

    private String getAllowedValues() {
        return Arrays.stream(enumClass.getEnumConstants())
            .map(Object::toString)
            .collect(Collectors.joining(", "));
    }
}
