package com.vineyards.deerPlanner.events.facade;

import com.vineyards.deerPlanner.events.facade.dto.UpdateWeddingDetailDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDetailDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDressCodePayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingGiftRegistryPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingParentsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingStoryPayloadDto;
import java.util.Optional;
import org.jmolecules.architecture.hexagonal.PrimaryPort;

/**
 * Primary port for the wedding-specific extension of an event. Mirrors the pattern the
 * birthday/anniversary extensions will follow when they land. Every method except {@link
 * #findByEventId(String)} requires ownership; that one is a cross-context read used by {@code
 * PublicInvitationService} once the invitation has already been validated as active.
 */
@PrimaryPort
public interface WeddingEventInPort {

  /**
   * Returns the current wedding detail. Creates a transient empty one in the response if no row.
   */
  WeddingDetailDto getWeddingDetail(String eventId);

  /** Partial update of {@code partner1Name} / {@code partner2Name} / {@code countdownEnabled}. */
  WeddingDetailDto updateWeddingDetail(String eventId, UpdateWeddingDetailDto dto);

  WeddingDetailDto updateWeddingLanding(String eventId, WeddingLandingPayloadDto dto);

  WeddingDetailDto updateWeddingStory(String eventId, WeddingStoryPayloadDto dto);

  WeddingDetailDto updateWeddingDressCode(String eventId, WeddingDressCodePayloadDto dto);

  WeddingDetailDto updateWeddingGiftRegistry(String eventId, WeddingGiftRegistryPayloadDto dto);

  WeddingDetailDto updateWeddingParents(String eventId, WeddingParentsPayloadDto dto);

  WeddingDetailDto updateWeddingAccommodation(String eventId, WeddingAccommodationPayloadDto dto);

  /**
   * Cross-context read for invitation rendering. No auth at this layer — the caller (invitation
   * module) has already verified the eventId corresponds to an active, in-window invitation.
   * Returns empty when no row exists (e.g. organizer hasn't configured the wedding yet).
   */
  Optional<WeddingDetailDto> findByEventId(String eventId);
}
