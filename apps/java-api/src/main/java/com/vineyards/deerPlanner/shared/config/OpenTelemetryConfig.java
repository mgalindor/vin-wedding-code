package com.vineyards.deerPlanner.shared.config;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.instrumentation.logback.appender.v1_0.OpenTelemetryAppender;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenTelemetryConfig {

  @Bean
  @ConditionalOnProperty(
      value = "management.logging.export.otlp.enabled",
      havingValue = "true",
      matchIfMissing = false)
  InitializingBean initOpenTelemetry(OpenTelemetry openTelemetry) {
    return () -> {
      OpenTelemetryAppender.install(openTelemetry);
    };
  }
}
