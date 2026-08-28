package com.vineyards.deerPlanner.shared.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import com.vineyards.deerPlanner.shared.config.JwtProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.util.Date;
import java.util.UUID;
import java.util.function.Consumer;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtService implements JwtIssuerPort {

    private static final String REFRESH_AUDIENCE = "refresh";

    private final JwtProperties props;
    private RSAKey signingKey;
    private RSASSASigner signer;
    private JWSKeySelector<SecurityContext> keySelector;
    private RSAKey publicJwk;

    @PostConstruct
    void initializeKeys() {
        try {
            this.signingKey = loadSigningKey(props);
            this.signer = new RSASSASigner(signingKey);
            this.publicJwk = signingKey.toPublicJWK();
            this.keySelector = new JWSVerificationKeySelector<>(
                JWSAlgorithm.RS256,
                new ImmutableJWKSet<>(new JWKSet(publicJwk))
            );
        } catch (JOSEException e) {
            throw new IllegalStateException("Failed to initialise JWT signing key", e);
        }
    }

    @Override
    public String issueAccessToken(String userId, String username, String displayName, String email, String role) {
        long ttl = props.getAccessTokenTtlSeconds();
        return issue(userId, username, role, props.getAudience(), ttl, claims -> {
            claims.claim("displayName", displayName);
            claims.claim("email", email);
        });
    }

    @Override
    public String issueRefreshToken(String userId, String username, String role) {
        long ttl = props.getRefreshTokenTtlSeconds();
        return issue(userId, username, role, REFRESH_AUDIENCE, ttl, claims -> {
            claims.claim("type", "refresh");
        });
    }

    @Override
    public long accessTokenTtlSeconds() {
        return props.getAccessTokenTtlSeconds();
    }

    @Override
    public long refreshTokenTtlSeconds() {
        return props.getRefreshTokenTtlSeconds();
    }

    public JWTClaimsSet verifyAccessToken(String token) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            DefaultJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
            processor.setJWSKeySelector(keySelector);
            return processor.process(jwt, null);
        } catch (ParseException | com.nimbusds.jose.proc.BadJOSEException | JOSEException e) {
            // Processor.process() throws BadJOSEException for verification failures and
            // JOSEException for lower-level errors — collapse both into one mapped exception.
            throw new JwtVerificationException("Invalid or expired token: " + e.getMessage(), e);
        }
    }

    public String getJwksJson() {
        return new JWKSet(publicJwk).toString(true);
    }

    private String issue(
        String userId,
        String username,
        String role,
        String audience,
        long ttlSeconds,
        Consumer<JWTClaimsSet.Builder> claimsCustomizer
    ) {
        try {
            Date now = new Date();
            Date exp = new Date(now.getTime() + ttlSeconds * 1000L);

            JWTClaimsSet.Builder claimsBuilder = new JWTClaimsSet.Builder()
                .subject(userId)
                .issuer(props.getIssuer())
                .audience(audience)
                .issueTime(now)
                .notBeforeTime(now)
                .expirationTime(exp)
                .jwtID(UUID.randomUUID().toString())
                .claim("username", username)
                .claim("role", role);

            if (claimsCustomizer != null) {
                claimsCustomizer.accept(claimsBuilder);
            }

            JWTClaimsSet claims = claimsBuilder.build();

            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                .type(JOSEObjectType.JWT)
                .keyID(signingKey.getKeyID())
                .build();

            SignedJWT signed = new SignedJWT(header, claims);
            signed.sign(signer);
            return signed.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Failed to sign JWT", e);
        }
    }

    private static RSAKey loadSigningKey(JwtProperties props) throws JOSEException {
        String pem = props.getPrivateKey();

        if (pem == null || pem.isBlank()) {
            log.warn("JWT signing key is not configured — generating an ephemeral RSA key. " +
                "DO NOT use this in production. Set deerplanner.jwt.private-key.");
            return new RSAKeyGenerator(2048, props.getKeyId()).generate();
        }

        try {
            com.nimbusds.jose.jwk.JWK jwk = com.nimbusds.jose.jwk.JWK.parseFromPEMEncodedObjects(pem);
            if (!(jwk instanceof RSAKey rsaKey)) {
                throw new IllegalStateException(
                    "Expected an RSA key in PEM format; got " + jwk.getClass().getSimpleName());
            }
            if (rsaKey.getKeyID() == null || rsaKey.getKeyID().isBlank()) {
                rsaKey = new RSAKey.Builder(rsaKey)
                    .keyID(props.getKeyId())
                    .build();
            }
            return rsaKey;
        } catch (JOSEException e) {
            throw new IllegalStateException("Invalid JWT private key: " + e.getMessage(), e);
        }
    }

    public static class JwtVerificationException extends RuntimeException {
        public JwtVerificationException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    // Tiny helper to generate a fresh RSA key for ephemeral/dev mode.
    private static final class RSAKeyGenerator {
        private final int keySize;
        private final String keyId;

        RSAKeyGenerator(int keySize, String keyId) {
            this.keySize = keySize;
            this.keyId = keyId;
        }

        RSAKey generate() throws JOSEException {
            try {
                java.security.KeyPairGenerator generator = java.security.KeyPairGenerator.getInstance("RSA");
                generator.initialize(keySize);
                java.security.KeyPair pair = generator.generateKeyPair();
                return new RSAKey.Builder((java.security.interfaces.RSAPublicKey) pair.getPublic())
                    .privateKey((java.security.interfaces.RSAPrivateKey) pair.getPrivate())
                    .keyID(keyId)
                    .build();
            } catch (java.security.NoSuchAlgorithmException e) {
                throw new JOSEException("RSA not available", e);
            }
        }
    }
}
