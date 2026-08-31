package com.vineyards.deerPlanner.shared.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.modulith.PackageInfo;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.RollbackOn;

@PackageInfo
@Configuration
@EnableJpaAuditing
@EnableTransactionManagement(rollbackOn = RollbackOn.ALL_EXCEPTIONS)
public class JpaConfig {}
