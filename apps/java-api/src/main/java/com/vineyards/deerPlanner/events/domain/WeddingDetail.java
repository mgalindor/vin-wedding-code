package com.vineyards.deerPlanner.events.domain;

import com.vineyards.deerPlanner.events.domain.payload.WeddingAccommodationPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingDressCodePayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingGiftRegistryPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingLandingPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingParentsPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingStoryPayload;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeddingDetail {
  private String partner1Name;
  private String partner2Name;
  private boolean countdownEnabled;
  private WeddingLandingPayload landingPayload;
  private WeddingStoryPayload storyPayload;
  private WeddingDressCodePayload dressCodePayload;
  private WeddingGiftRegistryPayload giftRegistryPayload;
  private WeddingParentsPayload parentsPayload;
  private WeddingAccommodationPayload accommodationPayload;
}
