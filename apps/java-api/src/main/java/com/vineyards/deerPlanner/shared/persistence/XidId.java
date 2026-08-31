package com.vineyards.deerPlanner.shared.persistence;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import org.hibernate.annotations.IdGeneratorType;

/**
 * Binds the Hibernate id generation for an entity primary key to {@link XidGenerator}, which
 * produces a 20-character Xid (the project's standard alphanumeric identifier).
 *
 * <p>Apply alongside {@code @Id} on the {@code id} field of an entity.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.METHOD})
@IdGeneratorType(XidGenerator.class)
public @interface XidId {}
