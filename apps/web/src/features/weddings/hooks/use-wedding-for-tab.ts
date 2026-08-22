import { useLocation } from '@tanstack/react-router';
import type { WeddingDto } from '@wendy/contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useWeddingsService } from '../weddings.service';

interface DetailState {
  wedding?: WeddingDto;
}

/**
 * Shared GET hook for every wedding-detail tab (Overview, Wedding
 * Data, Guests, Photos, Invitation).
 *
 * Why a hook instead of a layout route: the edit form at
 * `/dashboard/weddings/{id}/edit` is a sibling, not a child, of the
 * tab routes — TanStack Router's pathless layout requires all children
 * to share the same parent. A hook keeps the tab screens independent
 * (each owns its GET + render lifecycle) and still DRYs the fetch
 * boilerplate that the original US-009 placeholder had inline.
 *
 * Behaviour:
 *   - Reads the navigation-state payload as the optimistic fallback
 *     (create / edit happy path lands with the response in state).
 *   - Issues GET on mount; once the fetch resolves, the server values
 *     replace the optimistic ones.
 *   - Surfaces a localized error message when the fetch fails —
 *     the same envelope every other unauthorized / missing case
 *     surfaces (no enumeration).
 */
export function useWeddingForTab(weddingId: string): {
  wedding: WeddingDto | null;
  loadError: string | null;
} {
  const { t } = useTranslation('weddings');
  const service = useWeddingsService();
  const location = useLocation();
  const optimistic = (location.state as DetailState | undefined)?.wedding ?? null;

  const [wedding, setWedding] = useState<WeddingDto | null>(optimistic);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setWedding(optimistic);
    service
      .getWedding(weddingId)
      .then((data) => {
        if (!cancelled) setWedding(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : t('detailPlaceholder.errors.loadFailed');
          setLoadError(message);
        }
      });
    return () => {
      cancelled = true;
    };
    // The optimistic payload is intentionally excluded from the deps —
    // including it would cause an extra fetch whenever a navigation
    // lands with state.
  }, [weddingId, service, t]);

  return { wedding, loadError };
}
