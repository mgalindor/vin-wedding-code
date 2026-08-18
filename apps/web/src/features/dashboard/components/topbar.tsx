import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '@/features/locale-switcher/locale-switcher';
import { Button } from '@/shared/ui/button';

interface TopbarProps {
  readonly greetingName: string;
  readonly date: string;
  readonly onNewWedding?: () => void;
}

export function Topbar({
  greetingName,
  date,
  onNewWedding,
}: TopbarProps): React.ReactElement {
  const { t } = useTranslation('dashboard');

  return (
    <header
      className="flex items-center justify-between border-b px-10 py-4"
      style={{
        background: 'var(--color-surface-container-lowest)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      <div>
        <h1
          className="text-[22px] font-semibold leading-tight text-[var(--color-on-surface)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('greeting', { name: greetingName })}
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-secondary)]">
          {t('topbar.date', { date })}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <LocaleSwitcher />
        {onNewWedding && (
          <Button type="button" variant="default" onClick={onNewWedding}>
            {t('topbar.newWedding')}
          </Button>
        )}
      </div>
    </header>
  );
}
