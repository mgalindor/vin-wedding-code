package com.vineyards.deerPlanner.invitation.facade;

import com.vineyards.deerPlanner.invitation.facade.dto.InvitationTemplateDto;
import com.vineyards.deerPlanner.invitation.facade.dto.ListInvitationTemplatesResponse;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

import java.util.Optional;

@PrimaryPort
public interface InvitationTemplateApi {

    /**
     * @param eventType   the {@code event_type} discriminator (e.g. "wedding", "birthday"). Passed
     *                    as a string so this port never has to depend on the events module's
     *                    internal {@code EventType} enum (Spring Modulith boundary rule).
     * @param onlyActive  when true, only returns templates flagged active.
     */
    ListInvitationTemplatesResponse listByEventType(String eventType, boolean onlyActive);

    Optional<InvitationTemplateDto> findById(String templateId);
}
