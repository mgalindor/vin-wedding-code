import { useNavigate } from '@tanstack/react-router';
import { type OnboardWeddingPlannerResponseDto } from '@wendy/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';

interface CredentialsConfirmationScreenProps {
  plannerId: string;
  state: { credentials?: OnboardWeddingPlannerResponseDto };
}

export function CredentialsConfirmationScreen({
  plannerId,
  state,
}: CredentialsConfirmationScreenProps): React.ReactElement {
  const { t } = useTranslation('admin-onboarding');
  const navigate = useNavigate();
  const [ack, setAck] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(
    null,
  );

  const credentials = state.credentials;

  if (!credentials) {
    void navigate({ to: '/dashboard' });
    return <></>;
  }

  const copy = async (field: 'username' | 'password', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // Clipboard API unavailable in this context; user can copy by hand.
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-8 py-12">
      <header className="mb-6 space-y-2">
        <h1
          className="text-3xl font-semibold leading-tight text-[#1c1b1a]"
          style={{ fontFamily: 'Playfair Display, serif', letterSpacing: '-0.02em' }}
        >
          {t('confirmation.pageTitle')}
        </h1>
        <p className="max-w-prose text-sm leading-relaxed text-[#605e5c]">
          {t('confirmation.subtitle')}
        </p>
      </header>

      <section className="space-y-4 rounded-lg border border-[#d0c5af] bg-white p-6">
        {/* Username */}
        <div>
          <label
            htmlFor="credentials-username"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#605e5c]"
          >
            {t('confirmation.usernameLabel')}
          </label>
          <div className="flex items-stretch gap-2">
            <input
              id="credentials-username"
              type="text"
              readOnly
              value={credentials.username}
              className="flex-1 rounded border border-[#d0c5af] bg-[#f9f8f7] px-3 py-2 font-mono text-sm text-[#1c1b1a] focus:outline-none"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void copy('username', credentials.username)}
            >
              {copiedField === 'username' ? `✓ ${t('confirmation.copied')}` : t('confirmation.copy')}
            </Button>
          </div>
        </div>

        {/* Initial Password */}
        <div>
          <label
            htmlFor="credentials-password"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#605e5c]"
          >
            {t('confirmation.passwordLabel')}
          </label>
          <div className="flex items-stretch gap-2">
            <input
              id="credentials-password"
              type="text"
              readOnly
              value={credentials.initialPassword}
              className="flex-1 rounded border border-[#d0c5af] bg-[#f9f8f7] px-3 py-2 font-mono text-sm text-[#1c1b1a] focus:outline-none"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void copy('password', credentials.initialPassword)}
            >
              {copiedField === 'password' ? `✓ ${t('confirmation.copied')}` : t('confirmation.copy')}
            </Button>
          </div>
        </div>

        {/* Inline warning — visible while the password is on screen */}
        <div
          role="alert"
          className="rounded border-l-4 border-[#d4af37] bg-[#ffe088] px-4 py-3 text-sm leading-relaxed text-[#554300]"
        >
          {t('confirmation.warning')}
        </div>

        {/* Mandatory acknowledgement */}
        <label className="flex cursor-pointer items-start gap-3 pt-2 text-sm text-[#1c1b1a]">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[#735c00]"
          />
          <span>{t('confirmation.acknowledge')}</span>
        </label>
      </section>

      <div className="mt-6 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => void navigate({ to: '/dashboard/wedding-planners' })}
        >
          ← {t('confirmation.back')}
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={!ack}
          onClick={() => {
            void navigate({ to: '/dashboard/wedding-planners' });
          }}
        >
          {t('confirmation.primaryAction')}
        </Button>
      </div>

      {/* Keep plannerId referenced so future links can use it; keeps TS happy */}
      <span hidden data-planner-id={plannerId} />
    </main>
  );
}