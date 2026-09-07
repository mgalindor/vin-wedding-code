/**
 * Public-invitation barrel.
 *
 * Anything in `public/` is read-only data driven by the BE wire-up.
 * External callers should import from this barrel rather than
 * reaching into the per-file paths.
 */

export { PublicInvitationPage } from './public-invitation-page';
export {
  TEMPLATE_REGISTRY,
  getTemplateEntry,
  ALL_TEMPLATE_CODES,
} from './registry';
export type { TemplateRegistryEntry, TemplateComponent } from './registry';

export type {
  PublicInvitationData,
  PublicInvitationEventType,
  PublicInvitationLocale,
  PublicInvitationLocation,
  PublicInvitationProgram,
  PublicInvitationProgramDay,
  PublicInvitationProgramItem,
  PublicInvitationPageProps,
  WeddingPublicData,
  BirthdayPublicData,
  CorporatePublicData,
  AnniversaryPublicData,
  CorporateSpeaker,
} from './types';

export { buildSampleInvitation } from './sample-data';
export type { SampleOptions } from './sample-data';

export {
  mapPublicInvitationDtoToData,
  resolvePublicLocale,
  isInvitationActive,
} from './mapper';

export { RsvpForm, usePublicInvitation, useSubmitGroupRsvp } from './rsvp-form';