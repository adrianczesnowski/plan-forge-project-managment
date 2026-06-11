import type { ReactNode } from 'react';
import { BrandPanel } from '@/features/auth/ui/brand/BrandPanel';

interface AuthLayoutProps {
  brand: {
    headline: string;
    headlineAccent: string;
    subtext: string;
    content: ReactNode;
  };
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/** Two-panel auth screen: dark brand panel on the left, form on the right. */
export function AuthLayout({ brand, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <BrandPanel
        headline={brand.headline}
        headlineAccent={brand.headlineAccent}
        subtext={brand.subtext}
      >
        {brand.content}
      </BrandPanel>

      <div className="flex flex-1 items-center justify-center p-8 md:p-10">
        <div className="w-full max-w-[380px]">
          <h2 className="mb-1.5 animate-fade-in-up text-2xl font-bold tracking-tight [animation-delay:0.15s]">
            {title}
          </h2>
          <p className="mb-9 animate-fade-in-up text-sm text-muted-foreground [animation-delay:0.2s]">
            {subtitle}
          </p>

          {children}

          <p className="mt-6 animate-fade-in-up text-center text-[13px] text-muted-foreground [animation-delay:0.45s]">
            {footer}
          </p>
        </div>
      </div>
    </div>
  );
}
