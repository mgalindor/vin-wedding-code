package com.vineyards.deerPlanner.shared.persistence;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.modulith.PackageInfo;

/**
 * Marks the {@code shared.persistence} package as exposed to every application module — {@link
 * XidId}, {@link AuditorAwareImpl} and this class itself are intended to be referenced from
 * entities living in the events / guests / identity / invitation modules.
 */
@PackageInfo
@Configuration
@EnableJpaAuditing
@ConditionalOnClass(name = "jakarta.persistence.Entity")
@ConditionalOnProperty(
    name = "spring.data.jpa.auditing.enabled",
    havingValue = "true",
    matchIfMissing = true)
public class JpaAuditingConfig {}
