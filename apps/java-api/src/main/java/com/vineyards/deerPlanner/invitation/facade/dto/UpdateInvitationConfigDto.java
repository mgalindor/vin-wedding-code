package com.vineyards.deerPlanner.invitation.facade.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Anything null is left untouched (blueprint §5 partial updates).
 *
 * <p>The {@code slug} field is what becomes the public URL identifier ({@code /invitations/{slug}}).
 * It must be lowercase kebab-case and unique across the platform — uniqueness is enforced
 * at the database level ({@code uk_event_invitation_config_slug}).
 */
public record UpdateInvitationConfigDto(
    @Size(max = 36)
    String templateId,

    Boolean active,

    @Future
    LocalDate deadline,

    Boolean rsvpEnabled,

    @Future
    LocalDate rsvpDeadline,

    @NotBlank
    @Size(min = 3, max = 80)
    @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        message = "slug must be lowercase kebab-case (e.g. 'emma-james-2026')")
    String slug
) {
}
