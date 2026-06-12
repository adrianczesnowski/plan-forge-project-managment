import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

type StepState = 'done' | 'active' | 'upcoming';

function StepDot({ state, number }: { state: StepState; number: number }) {
  return (
    <div
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
        state === 'done' && 'border-accent-green bg-accent-green text-white',
        state === 'active' && 'border-primary bg-primary text-white',
        state === 'upcoming' && 'border-border bg-white text-faint',
      )}
    >
      {state === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : number}
    </div>
  );
}

/** Registration → Organization → First project; this screen is always step 2. */
export function OnboardingStepper() {
  const { t } = useTranslation('onboarding');

  const steps: { label: string; state: StepState }[] = [
    { label: t('steps.registration'), state: 'done' },
    { label: t('steps.organization'), state: 'active' },
    { label: t('steps.firstProject'), state: 'upcoming' },
  ];

  return (
    <div className="mb-8 flex animate-fade-in-up items-center [animation-delay:0.1s]">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          {index > 0 && (
            <div
              className={cn(
                'mx-3 h-0.5 w-12',
                steps[index - 1]?.state === 'done' ? 'bg-accent-green' : 'bg-border',
              )}
            />
          )}
          <div className="flex flex-col items-center gap-1.5">
            <StepDot state={step.state} number={index + 1} />
            <span
              className={cn(
                'text-[12.5px]',
                step.state === 'active' ? 'font-semibold text-foreground' : 'text-faint',
              )}
            >
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
