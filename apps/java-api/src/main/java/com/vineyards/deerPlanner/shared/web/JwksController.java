package com.vineyards.deerPlanner.shared.web;

import com.vineyards.deerPlanner.shared.security.JwtAuthenticator;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/.well-known")
@PrimaryAdapter
@RequiredArgsConstructor
@Slf4j
public class JwksController {

  private final JwtAuthenticator jwtAuthenticator;

  @GetMapping(path = "/jwks.json")
  public ResponseEntity<String> jwks() {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic())
        .contentType(MediaType.APPLICATION_JSON)
        .body(jwtAuthenticator.getJwksJson());
  }
}
