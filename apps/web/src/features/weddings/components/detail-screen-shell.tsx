import type { WeddingDto } from '@wendy/contracts';
import type { ReactNode } from 'react';

/**
 * Shared load / error skeleton for every wedding-detail tab.
 *
 * The 5 tab screens (Overview, Wedding Data, Guests, Photos,
 * Invitation) all do the same GET and surface the same loading /
 * error states. This shell centralises the skeleton + error banner so
 * the tab screens only render their own content via `children`.
 *
 * The shell uses a render-prop pattern (`children(wedding)`) so the
 * tab screens can rely on `wedding` being non-null inside the
 * callback — no null checks at the call site.
 */
export function DetailScreenShell({
  wedding,
  loadError,
  loadingLabel,
  children,
}: {
  wedding: WeddingDto | null;
  loadError: string | null;
  loadingLabel: string;
  children: (wedding: WeddingDto) => ReactNode;
}): React.ReactElement {
  if (loadError) {
    return (
      <div role="alert" className="rounded border-l-4 border-[var(--color-destructive)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-foreground)]">
        {loadError}
      </div>
    );
  }
  if (!wedding) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="text-sm text-[var(--color-secondary)]"
      >
        {loadingLabel}
      </div>
    );
  }
  return <>{children(wedding)}</>;
}
