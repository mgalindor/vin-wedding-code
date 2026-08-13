import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';

export function DashboardPlaceholderScreen(): React.ReactElement {
  const { t } = useTranslation('common');

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 p-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          {t('app.title')}
        </p>
        <h1 className="text-3xl font-semibold leading-tight text-foreground">
          {t('dashboard.greeting')}
        </h1>
        <p className="max-w-prose text-base text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </header>

      <Button variant="default" type="button" disabled>
        {t('dashboard.placeholderButton')}
      </Button>
    </main>
  );
}

export default DashboardPlaceholderScreen;