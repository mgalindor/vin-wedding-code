/**
 * Shell component for the guest-facing invitation.
 *
 * Responsibilities:
 *   1. Resolve `data.templateCode` against the registry.
 *   2. Verify the resolved template is registered for `data.eventType`.
 *   3. Wrap the lazy template in `<Suspense>` and forward the per-eventType
 *      data plus `onRsvpClick` and `locale` as props.
 *   4. Set `lang` on the wrapping element so screen readers and the
 *      browser hyphenation engine pick the correct language.
 *
 * The actual visual rendering lives in the 27 templates under
 * `templates/{wedding,birthday,corporate,anniversary}/`.
 */

import { Suspense, type ReactElement } from 'react';

import { getTemplateEntry } from './registry';
import type {
  PublicInvitationData,
  PublicInvitationPageProps,
} from './types';

export function PublicInvitationPage({
  data,
  onRsvpClick,
  token: _token,
}: PublicInvitationPageProps): ReactElement {
  const entry = getTemplateEntry(data.templateCode);

  if (!entry) {
    return <UnknownTemplatePanel code={data.templateCode} />;
  }

  if (entry.eventType !== data.eventType) {
    return (
      <TemplateMismatchPanel
        code={data.templateCode}
        expected={entry.eventType}
        got={data.eventType}
      />
    );
  }

  const Component = entry.component;

  return (
    <div lang={data.locale}>
      <Suspense fallback={<LoadingSkeleton />}>
        <Component
          {...(data as unknown as Record<string, unknown>)}
          onRsvpClick={onRsvpClick}
          locale={data.locale}
        />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-outline-variant)] border-t-[var(--color-primary)]" />
    </div>
  );
}

function UnknownTemplatePanel({
  code,
}: {
  code: string;
}): ReactElement {
  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="font-display text-2xl">Template unavailable</h1>
      <p className="mt-2 text-sm text-[var(--color-secondary)]">
        The code{' '}
        <code className="rounded bg-[var(--color-surface-container-low)] px-1 py-0.5 font-mono">
          {code}
        </code>{' '}
        is not registered. The organizer may have archived this template.
      </p>
    </main>
  );
}

function TemplateMismatchPanel(props: {
  code: string;
  expected: string;
  got: string;
}): ReactElement {
  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="font-display text-2xl">Template mismatch</h1>
      <p className="mt-2 text-sm text-[var(--color-secondary)]">
        Template{' '}
        <code className="font-mono">{props.code}</code> is registered for{' '}
        <code className="font-mono">{props.expected}</code> but received{' '}
        <code className="font-mono">{props.got}</code> data.
      </p>
    </main>
  );
}