/**
 * Dev-only gallery preview route.
 *
 * Renders every registered template (27 today) with realistic sample
 * data, grouped by eventType in a vertical stack. Each preview is
 * wrapped in an `<article data-template-code="...">` so QA can take
 * per-template screenshots and the team can flip the locale on the
 * fly.
 *
 * No auth: this route is intentionally open so designers and external
 * reviewers can poke at every template without an account.
 */
import { useState, type ReactElement } from 'react';

import { PublicInvitationPage } from '@/features/invitations/public/public-invitation-page';
import { ALL_TEMPLATE_CODES } from '@/features/invitations/public/registry';
import { buildSampleInvitation } from '@/features/invitations/public/sample-data';
import type {
  PublicInvitationEventType,
  PublicInvitationLocale,
} from '@/features/invitations/public/types';

const CODES_BY_EVENT_TYPE: Record<PublicInvitationEventType, string[]> = {
  wedding: ALL_TEMPLATE_CODES.filter((c) => c.startsWith('wedding-')),
  birthday: ALL_TEMPLATE_CODES.filter((c) => c.startsWith('birthday-')),
  corporate: ALL_TEMPLATE_CODES.filter((c) => c.startsWith('corporate-')),
  anniversary: ALL_TEMPLATE_CODES.filter((c) => c.startsWith('anniversary-')),
};

const EVENT_TYPE_ORDER: readonly PublicInvitationEventType[] = [
  'wedding',
  'birthday',
  'corporate',
  'anniversary',
];

export function TemplateGalleryPreview(): ReactElement {
  const [locale, setLocale] = useState<PublicInvitationLocale>('es');

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-white/95 px-6 py-3 backdrop-blur">
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Deer Planner · Template gallery (QA)
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLocale('en')}
            aria-pressed={locale === 'en'}
            className={
              'rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wider ' +
              (locale === 'en'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] text-[var(--color-secondary)]')
            }
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale('es')}
            aria-pressed={locale === 'es'}
            className={
              'rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-wider ' +
              (locale === 'es'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                : 'border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] text-[var(--color-secondary)]')
            }
          >
            ES
          </button>
        </div>
      </header>

      {EVENT_TYPE_ORDER.map((evt) => (
        <section
          key={evt}
          className="border-b border-[var(--color-outline-variant)]"
        >
          <h2
            className="px-6 py-4 text-2xl font-semibold capitalize"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {evt}
          </h2>
          {CODES_BY_EVENT_TYPE[evt].map((code) => {
            const data = buildSampleInvitation({ templateCode: code, locale });
            return (
              <article
                key={code}
                className="border-t border-[var(--color-outline-variant)]"
                data-template-code={code}
              >
                <header className="sticky top-14 z-10 flex items-center justify-between border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]/95 px-6 py-2 backdrop-blur">
                  <code className="font-mono text-xs text-[var(--color-secondary)]">
                    {code}
                  </code>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-secondary)]">
                    {data.eventType}
                  </span>
                </header>
                <PublicInvitationPage
                  data={data}
                  token={`preview-${code}`}
                  locale={locale}
                />
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}