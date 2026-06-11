import { Activity, Clock, Gem } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

interface PreviewCard {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  titleKey: 'card1Title' | 'card2Title' | 'card3Title';
  metaKey: 'card1Meta' | 'card2Meta' | 'card3Meta';
  progress: number;
  progressColor: string;
}

const CARDS: PreviewCard[] = [
  {
    icon: Gem,
    iconColor: 'text-accent-purple',
    iconBg: 'bg-accent-purple/15',
    titleKey: 'card1Title',
    metaKey: 'card1Meta',
    progress: 38,
    progressColor: 'bg-accent-purple',
  },
  {
    icon: Clock,
    iconColor: 'text-accent-orange',
    iconBg: 'bg-accent-orange/15',
    titleKey: 'card2Title',
    metaKey: 'card2Meta',
    progress: 65,
    progressColor: 'bg-accent-orange',
  },
  {
    icon: Activity,
    iconColor: 'text-accent-green',
    iconBg: 'bg-accent-green/15',
    titleKey: 'card3Title',
    metaKey: 'card3Meta',
    progress: 12,
    progressColor: 'bg-accent-green',
  },
];

/** Fake project cards shown on the login screen's brand panel. */
export function BrandPreviewCards() {
  const { t } = useTranslation('auth');

  return (
    <div className="flex flex-col gap-2.5">
      {CARDS.map((card, index) => (
        <div
          key={card.titleKey}
          className="flex animate-fade-in-up items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm"
          style={{ animationDelay: `${0.2 + index * 0.1}s` }}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${card.iconBg}`}
          >
            <card.icon className={`h-[18px] w-[18px] ${card.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-[13px] font-semibold text-white/90">
              {t(`brand.preview.${card.titleKey}`)}
            </div>
            <div className="text-[11.5px] text-white/35">{t(`brand.preview.${card.metaKey}`)}</div>
          </div>
          <div className="h-[5px] w-14 shrink-0 overflow-hidden rounded-[3px] bg-white/10">
            <div
              className={`h-full rounded-[3px] ${card.progressColor}`}
              style={{ width: `${card.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
