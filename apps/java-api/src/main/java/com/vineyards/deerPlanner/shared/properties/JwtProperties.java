package com.vineyards.deerPlanner.shared.properties;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "deerplanner.jwt")
@Getter
@Setter
@Slf4j
public class JwtProperties {

  @NotBlank private String issuer = "deer-planner";

  @NotBlank private String audience = "deer";

  @NotBlank private String keyId = "deer-planner-key-1";

  @Min(60)
  private long accessTokenTtlSeconds = 3600;

  @Min(3600)
  private long refreshTokenTtlSeconds = 259200;

  private String privateKey = "";
}
