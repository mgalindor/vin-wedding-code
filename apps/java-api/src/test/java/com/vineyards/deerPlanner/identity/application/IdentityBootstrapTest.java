package com.vineyards.deerPlanner.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.vineyards.deerPlanner.identity.application.port.UserOutPort;
import com.vineyards.deerPlanner.identity.domain.Role;
import com.vineyards.deerPlanner.identity.domain.User;
import java.util.Optional;
import java.util.regex.Pattern;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class IdentityBootstrapTest {

  @Mock UserOutPort userRepository;

  private PasswordEncoder encoder;
  private IdentityBootstrap bootstrap;
  private ListAppender<ILoggingEvent> logAppender;
  private Logger bootstrapLogger;

  private static final Pattern PASSWORD_PATTERN = Pattern.compile("^[A-Za-z0-9]{10}$");

  @BeforeEach
  void setUp() {
    encoder = new BCryptPasswordEncoder(12);
    bootstrap = new IdentityBootstrap(defaultProps(), userRepository, encoder);

    bootstrapLogger = (Logger) LoggerFactory.getLogger(IdentityBootstrap.class);
    logAppender = new ListAppender<>();
    logAppender.start();
    bootstrapLogger.addAppender(logAppender);
  }

  @AfterEach
  void tearDown() {
    bootstrapLogger.detachAppender(logAppender);
  }

  private static BootstrapProperties defaultProps() {
    BootstrapProperties props = new BootstrapProperties();
    props.setEnabled(true);
    props.setUsername("admin@deer");
    props.setDisplayName("Administrator");
    props.setEmail("admin@deer");
    return props;
  }

  @Test
  void run_whenNoAdminExists_createsUserWithBothRolesAndLogsTemporaryPassword() {
    when(userRepository.findByUsername("admin@deer")).thenReturn(Optional.empty());
    when(userRepository.create(any(User.class)))
        .thenAnswer(
            inv -> {
              User u = inv.getArgument(0);
              return User.builder()
                  .id("dab1528oqp9m313gn2s0")
                  .username(u.getUsername())
                  .displayName(u.getDisplayName())
                  .email(u.getEmail())
                  .passwordHash(u.getPasswordHash())
                  .isActive(true)
                  .roles(u.getRoles())
                  .build();
            });

    bootstrap.run();

    ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
    verify(userRepository).create(captor.capture());
    User persisted = captor.getValue();

    assertThat(persisted.getUsername()).isEqualTo("admin@deer");
    assertThat(persisted.getDisplayName()).isEqualTo("Administrator");
    assertThat(persisted.getEmail()).isEqualTo("admin@deer");
    assertThat(persisted.isActive()).isTrue();
    assertThat(persisted.getRoles())
        .containsExactlyInAnyOrder(Role.Administrator, Role.EventOrganizer);
    assertThat(persisted.getPasswordHash()).isNotBlank();

    // The hash must verify against the password we logged — recover it from the WARN banner.
    String loggedPassword = extractLoggedPassword();
    assertThat(loggedPassword).matches(PASSWORD_PATTERN);
    assertThat(encoder.matches(loggedPassword, persisted.getPasswordHash())).isTrue();

    assertThat(logAppender.list)
        .anyMatch(
            e ->
                e.getLevel() == Level.WARN
                    && e.getFormattedMessage().contains("INITIAL ADMIN BOOTSTRAPPED"));
    assertThat(logAppender.list)
        .anyMatch(
            e ->
                e.getLevel() == Level.WARN
                    && e.getFormattedMessage()
                        .contains("CHANGE THIS PASSWORD AS SOON AS POSSIBLE"));
  }

  @Test
  void run_whenAdminAlreadyExists_skipsCreationAndDoesNotLogPassword() {
    when(userRepository.findByUsername("admin@deer"))
        .thenReturn(Optional.of(User.builder().username("admin@deer").build()));

    bootstrap.run();

    verify(userRepository, never()).create(any(User.class));
    assertThat(logAppender.list)
        .anyMatch(
            e ->
                e.getLevel() == Level.INFO
                    && e.getFormattedMessage().contains("identity.bootstrap.skipped"));
    assertThat(logAppender.list)
        .noneMatch(e -> e.getFormattedMessage().contains("INITIAL ADMIN BOOTSTRAPPED"));
  }

  @Test
  void generatePassword_returnsTenAlphanumericChars() {
    for (int i = 0; i < 50; i++) {
      String pwd = IdentityBootstrap.generatePassword();
      assertThat(pwd).matches(PASSWORD_PATTERN);
    }
  }

  @Test
  void generatePassword_producesDifferentValuesAcrossCalls() {
    int distinct =
        java.util.stream.IntStream.range(0, 25)
            .mapToObj(i -> IdentityBootstrap.generatePassword())
            .collect(java.util.stream.Collectors.toSet())
            .size();
    // With a 62-char alphabet and 10-char output, 25 trials have effectively zero collision risk.
    assertThat(distinct).isEqualTo(25);
  }

  private String extractLoggedPassword() {
    return logAppender.list.stream()
        .map(ILoggingEvent::getFormattedMessage)
        .filter(msg -> msg.contains("temporary password:"))
        .map(
            msg ->
                msg.substring(msg.indexOf("temporary password:") + "temporary password:".length()))
        .map(String::trim)
        .findFirst()
        .orElseThrow(() -> new AssertionError("no log line with the temporary password"));
  }
}
