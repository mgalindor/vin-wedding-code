import { useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export function PublicInvitationPlaceholderScreen(): React.ReactElement {
  const { t } = useTranslation('common');
  const params = useParams({ strict: false }) as { token?: string };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 p-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          {t('app.title')}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-foreground">
          {t('invitation.placeholder')}
        </h1>
        <p className="max-w-prose text-base text-muted-foreground">
          {t('invitation.subtitle')}
        </p>
      </header>

      {params.token !== undefined && (
        <dl className="rounded-md border border-border bg-muted px-4 py-3 text-sm">
          <dt className="font-medium text-muted-foreground">
            {t('invitation.tokenLabel')}
          </dt>
          <dd className="font-mono text-foreground">{params.token}</dd>
        </dl>
      )}
    </main>
  );
}

export default PublicInvitationPlaceholderScreen;