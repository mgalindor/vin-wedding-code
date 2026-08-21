import { type WeddingDto } from '@wendy/contracts';

import { WeddingCard } from './wedding-card';

export interface WeddingCardGridProps {
  readonly weddings: readonly WeddingDto[];
}

export function WeddingCardGrid({
  weddings,
}: WeddingCardGridProps): React.ReactElement {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="wedding-card-grid"
    >
      {weddings.map((w) => (
        <WeddingCard key={w.id} wedding={w} />
      ))}
    </div>
  );
}
