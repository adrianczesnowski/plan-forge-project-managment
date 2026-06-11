import { ChartGantt, Gem, Network, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  titleKey: 'ganttTitle' | 'wbsTitle' | 'teamTitle' | 'milestonesTitle';
  descKey: 'ganttDesc' | 'wbsDesc' | 'teamDesc' | 'milestonesDesc';
}

const FEATURES: Feature[] = [
  {
    icon: ChartGantt,
    iconColor: 'text-accent-purple',
    iconBg: 'bg-accent-purple/15',
    titleKey: 'ganttTitle',
    descKey: 'ganttDesc',
  },
  {
    icon: Network,
    iconColor: 'text-accent-green',
    iconBg: 'bg-accent-green/15',
    titleKey: 'wbsTitle',
    descKey: 'wbsDesc',
  },
  {
    icon: Users,
    iconColor: 'text-accent-blue',
    iconBg: 'bg-accent-blue/15',
    titleKey: 'teamTitle',
    descKey: 'teamDesc',
  },
  {
    icon: Gem,
    iconColor: 'text-accent-orange',
    iconBg: 'bg-accent-orange/15',
    titleKey: 'milestonesTitle',
    descKey: 'milestonesDesc',
  },
];

/** Feature highlights shown on the register screen's brand panel. */
export function BrandFeatureList() {
  const { t } = useTranslation('auth');

  return (
    <div className="flex flex-col gap-3.5">
      {FEATURES.map((feature, index) => (
        <div
          key={feature.titleKey}
          className="flex animate-fade-in-up items-center gap-3.5"
          style={{ animationDelay: `${0.2 + index * 0.08}s` }}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${feature.iconBg}`}
          >
            <feature.icon className={`h-[18px] w-[18px] ${feature.iconColor}`} />
          </div>
          <div className="text-[13.5px] leading-snug text-white/70">
            <strong className="font-semibold text-white/90">
              {t(`brand.features.${feature.titleKey}`)}
            </strong>{' '}
            — {t(`brand.features.${feature.descKey}`)}
          </div>
        </div>
      ))}
    </div>
  );
}
