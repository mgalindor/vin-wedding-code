package com.vineyards.deerPlanner.events.facade.mapper;

import com.vineyards.deerPlanner.events.domain.payload.ContactsPayload;
import com.vineyards.deerPlanner.events.domain.payload.LocationsPayload;
import com.vineyards.deerPlanner.events.domain.payload.ProgramPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingAccommodationPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingDressCodePayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingGiftRegistryPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingLandingPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingParentsPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingStoryPayload;
import com.vineyards.deerPlanner.events.facade.dto.ContactsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.LocationsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.ProgramPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingAccommodationPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingDressCodePayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingGiftRegistryPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingLandingPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingParentsPayloadDto;
import com.vineyards.deerPlanner.events.facade.dto.WeddingStoryPayloadDto;
import org.mapstruct.Mapper;

@Mapper
public interface EventPayloadMapper {
  LocationsPayload toPayload(LocationsPayloadDto dto);

  LocationsPayloadDto toDto(LocationsPayload payload);

  ProgramPayload toPayload(ProgramPayloadDto dto);

  ProgramPayloadDto toDto(ProgramPayload payload);

  ContactsPayload toPayload(ContactsPayloadDto dto);

  ContactsPayloadDto toDto(ContactsPayload payload);

  WeddingLandingPayload toPayload(WeddingLandingPayloadDto dto);

  WeddingLandingPayloadDto toDto(WeddingLandingPayload payload);

  WeddingStoryPayload toPayload(WeddingStoryPayloadDto dto);

  WeddingStoryPayloadDto toDto(WeddingStoryPayload payload);

  WeddingDressCodePayload toPayload(WeddingDressCodePayloadDto dto);

  WeddingDressCodePayloadDto toDto(WeddingDressCodePayload payload);

  WeddingGiftRegistryPayload toPayload(WeddingGiftRegistryPayloadDto dto);

  WeddingGiftRegistryPayloadDto toDto(WeddingGiftRegistryPayload payload);

  WeddingParentsPayload toPayload(WeddingParentsPayloadDto dto);

  WeddingParentsPayloadDto toDto(WeddingParentsPayload payload);

  WeddingAccommodationPayload toPayload(WeddingAccommodationPayloadDto dto);

  WeddingAccommodationPayloadDto toDto(WeddingAccommodationPayload payload);
}
