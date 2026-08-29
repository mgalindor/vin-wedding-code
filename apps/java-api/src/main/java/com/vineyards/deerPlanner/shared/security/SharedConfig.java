package com.vineyards.deerPlanner.shared.security;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(com.vineyards.deerPlanner.shared.config.JwtProperties.class)
public class SharedConfig {}
