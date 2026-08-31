package com.vineyards.deerPlanner.events.outbound;

import com.vineyards.deerPlanner.events.domain.payload.WeddingAccommodationPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingDressCodePayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingGiftRegistryPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingLandingPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingParentsPayload;
import com.vineyards.deerPlanner.events.domain.payload.WeddingStoryPayload;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SoftDelete;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "wedding_events")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@SoftDelete
public class WeddingEventEntity {

  @Id private String eventId;
  private String partner1Name;
  private String partner2Name;
  private boolean countdownEnabled = true;

  @JdbcTypeCode(SqlTypes.JSON)
  private WeddingLandingPayload landingPayload;

  @JdbcTypeCode(SqlTypes.JSON)
  private WeddingStoryPayload storyPayload;

  @JdbcTypeCode(SqlTypes.JSON)
  private WeddingDressCodePayload dressCodePayload;

  @JdbcTypeCode(SqlTypes.JSON)
  private WeddingGiftRegistryPayload giftRegistryPayload;

  @JdbcTypeCode(SqlTypes.JSON)
  private WeddingParentsPayload parentsPayload;

  @JdbcTypeCode(SqlTypes.JSON)
  private WeddingAccommodationPayload accommodationPayload;
}
