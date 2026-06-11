import type { ReactNode } from 'react';
import { Github } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/shared/ui/logo';

interface BrandPanelProps {
  headline: string;
  headlineAccent: string;
  subtext: string;
  /** Panel-specific content: preview cards (login) or feature list (register). */
  children: ReactNode;
}

/** Dark left-hand panel of the auth screens: logo, headline, marketing content, OSS badge. */
export function BrandPanel({ headline, headlineAccent, subtext, children }: BrandPanelProps) {
  const { t } = useTranslation('auth');

  return (
    <div className="auth-brand-grid relative flex w-full flex-col justify-between overflow-hidden bg-brand p-7 md:min-w-[420px] md:w-[45%] md:p-12">
      {/* Radial glows */}
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.1)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-10 top-2/5 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)]" />

      <div className="relative z-1">
        <Logo className="mb-6 animate-fade-in-left md:mb-16" textClassName="text-white" />

        <h1 className="mb-4 max-w-[380px] animate-fade-in-left text-2xl font-bold leading-tight tracking-tight text-white [animation-delay:0.1s] md:text-4xl">
          {headline}
          <br />
          <span className="bg-gradient-to-br from-accent-purple to-accent-blue bg-clip-text text-transparent">
            {headlineAccent}
          </span>
        </h1>
        <p className="max-w-[340px] animate-fade-in-left text-[15px] leading-relaxed text-white/50 [animation-delay:0.15s]">
          {subtext}
        </p>

        <div className="mt-12 hidden md:block">{children}</div>
      </div>

      <div className="relative z-1 hidden pt-8 md:block">
        <div className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-4 py-2.5">
          <Github className="h-[18px] w-[18px] shrink-0 text-white/50" />
          <span className="text-[12.5px] text-white/45">
            {t('brand.openSource')}{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white/70 hover:text-white"
            >
              GitHub
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
