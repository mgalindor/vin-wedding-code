/**
 * Lazy-loaded registry from `templateCode` -> React component.
 *
 * Each entry uses `React.lazy()` so the 27 templates are split into
 * independent chunks. The shell dispatches by `data.templateCode`
 * (see `PublicInvitationPage`).
 *
 * Type notes:
 *  - `component: ComponentType<any>` is intentional: the per-eventType
 *    prop shapes are heterogeneous and only the matching data shape
 *    is valid for a given template. The shell performs the dispatch.
 *  - `eventType` is a runtime guard so we can refuse to render a
 *    wedding template with birthday data.
 */

import { lazy, type ComponentType } from 'react';

import type { PublicInvitationData } from './types';

export type TemplateComponent = ComponentType<
  Record<string, unknown> & { locale: 'en' | 'es' }
>;

export interface TemplateRegistryEntry {
  /** lazy React component (default export) */
  component: ComponentType<any>;
  /** eventType this template is registered for */
  eventType: PublicInvitationData['eventType'];
}

const T = (
  loader: () => Promise<{ default: ComponentType<any> }>,
  eventType: TemplateRegistryEntry['eventType'],
): TemplateRegistryEntry => ({
  component: lazy(loader),
  eventType,
});

export const TEMPLATE_REGISTRY: Readonly<Record<string, TemplateRegistryEntry>> =
  Object.freeze({
    // Wedding (6)
    'wedding-bosco': T(
      () => import('./templates/wedding/bosco'),
      'wedding',
    ),
    'wedding-cinematik': T(
      () => import('./templates/wedding/cinematik'),
      'wedding',
    ),
    'wedding-pampas': T(
      () => import('./templates/wedding/pampas'),
      'wedding',
    ),
    'wedding-noir': T(
      () => import('./templates/wedding/noir'),
      'wedding',
    ),
    'wedding-botanic': T(
      () => import('./templates/wedding/botanic'),
      'wedding',
    ),
    'wedding-sunset': T(
      () => import('./templates/wedding/sunset'),
      'wedding',
    ),

    // Birthday (9)
    'birthday-confetti': T(
      () => import('./templates/birthday/confetti'),
      'birthday',
    ),
    'birthday-velas': T(
      () => import('./templates/birthday/velas'),
      'birthday',
    ),
    'birthday-neon': T(
      () => import('./templates/birthday/neon'),
      'birthday',
    ),
    'birthday-jardin': T(
      () => import('./templates/birthday/jardin'),
      'birthday',
    ),
    'birthday-hollywood': T(
      () => import('./templates/birthday/hollywood'),
      'birthday',
    ),
    'birthday-picnic': T(
      () => import('./templates/birthday/picnic'),
      'birthday',
    ),
    'birthday-bebe': T(
      () => import('./templates/birthday/bebe'),
      'birthday',
    ),
    'birthday-pequeno-explorador': T(
      () => import('./templates/birthday/pequeno-explorador'),
      'birthday',
    ),
    'birthday-quinceanera': T(
      () => import('./templates/birthday/quinceanera'),
      'birthday',
    ),

    // Corporate (6)
    'corporate-boardroom': T(
      () => import('./templates/corporate/boardroom'),
      'corporate',
    ),
    'corporate-summit': T(
      () => import('./templates/corporate/summit'),
      'corporate',
    ),
    'corporate-tech': T(
      () => import('./templates/corporate/tech'),
      'corporate',
    ),
    'corporate-gala': T(
      () => import('./templates/corporate/gala'),
      'corporate',
    ),
    'corporate-pitch': T(
      () => import('./templates/corporate/pitch'),
      'corporate',
    ),
    'corporate-retreat': T(
      () => import('./templates/corporate/retreat'),
      'corporate',
    ),

    // Anniversary (6)
    'anniversary-bodas-de-oro': T(
      () => import('./templates/anniversary/bodas-de-oro'),
      'anniversary',
    ),
    'anniversary-vino': T(
      () => import('./templates/anniversary/vino'),
      'anniversary',
    ),
    'anniversary-atardecer': T(
      () => import('./templates/anniversary/atardecer'),
      'anniversary',
    ),
    'anniversary-jardin-secreto': T(
      () => import('./templates/anniversary/jardin-secreto'),
      'anniversary',
    ),
    'anniversary-vintage': T(
      () => import('./templates/anniversary/vintage'),
      'anniversary',
    ),
    'anniversary-noche-de-estrellas': T(
      () => import('./templates/anniversary/noche-de-estrellas'),
      'anniversary',
    ),
  } as const);

/** Lookup helper: returns null when the code is unknown. */
export function getTemplateEntry(code: string): TemplateRegistryEntry | null {
  return TEMPLATE_REGISTRY[code] ?? null;
}

/** Convenience: every registered templateCode (useful for QA previews). */
export const ALL_TEMPLATE_CODES: readonly string[] = Object.keys(
  TEMPLATE_REGISTRY,
);