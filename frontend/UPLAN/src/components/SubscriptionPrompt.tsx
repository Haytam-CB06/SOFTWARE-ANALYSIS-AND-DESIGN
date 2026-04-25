import { Building2, Check, GraduationCap, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import { useInlineText } from '../i18n/inlineText';

export type SubscriptionPlan = 'free' | 'pro' | 'university';

interface SubscriptionPromptProps {
  open: boolean;
  onClose: () => void;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

const plans = [
  {
    id: 'free' as const,
    name: 'Free',
    price: 'EUR 0',
    description: 'For students who want a simple planner.',
    icon: Sparkles,
    action: 'Continue free',
    featureTitle: 'Free includes',
    features: [
      '1 active personal timetable',
      'Manual schedule creation',
      'Basic assessment and deadline tracking',
      'Simple reminders for upcoming work',
      'Local saved preferences on this device',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: 'EUR 9',
    description: 'For students who want advanced planning.',
    icon: GraduationCap,
    action: 'Choose Pro',
    featured: true,
    featureTitle: 'Everything for independent study',
    features: [
      'Unlimited saved timetables',
      'AI timetable generation and rescheduling',
      'Google Calendar export',
      'Pomodoro focus tools',
      'Progress insights, goals, and achievements',
      'Private workspace collaboration',
    ],
  },
  {
    id: 'university' as const,
    name: 'University / Center',
    price: 'Custom',
    description: 'For institutions managing groups and teams.',
    icon: Building2,
    action: 'Contact sales',
    featureTitle: 'Built for organizations',
    features: [
      'Admin dashboard for students and staff',
      'Class, cohort, and center workspaces',
      'Seat management for departments or groups',
      'Central billing and invoice support',
      'Institution onboarding and priority support',
      'Custom rollout for universities and training centers',
    ],
  },
];

export default function SubscriptionPrompt({ open, onClose, onSelectPlan }: SubscriptionPromptProps) {
  const tt = useInlineText();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-3 py-5 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label={tt('Close subscription plans')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-slate-200 px-5 pb-5 pt-8 text-center dark:border-slate-800 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
            {tt('Choose your plan')}
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-4xl">
            {tt('Unlock the right U PLAN experience for your study workflow.')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            {tt('You can stay on the free plan, upgrade for individual tools, or choose an institutional plan for a university or training center.')}
          </p>
        </div>

        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`flex min-h-[420px] flex-col rounded-lg border p-5 ${
                  plan.featured
                    ? 'border-blue-600 bg-blue-50 shadow-md dark:border-blue-500 dark:bg-blue-950/30'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                    <Icon className="h-5 w-5" />
                  </div>
                  {plan.featured && (
                    <span className="rounded-md bg-blue-700 px-2.5 py-1 text-xs font-semibold text-white">
                      {tt('Popular')}
                    </span>
                  )}
                </div>

                <div className="mt-5">
                  <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{tt(plan.name)}</h3>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                      {tt(plan.price)}
                    </span>
                    {plan.id !== 'university' && (
                      <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">{tt('/ month')}</span>
                    )}
                  </div>
                  <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {tt(plan.description)}
                  </p>
                </div>

                <div className="mt-5 flex-1">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {tt(plan.featureTitle)}
                  </p>
                  <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{tt(feature)}</span>
                    </div>
                  ))}
                  </div>
                </div>

                <Button
                  onClick={() => onSelectPlan(plan.id)}
                  className={`mt-6 h-11 rounded-md ${
                    plan.featured
                      ? 'bg-blue-700 text-white hover:bg-blue-800'
                      : 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
                  }`}
                >
                  {tt(plan.action)}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-200 px-5 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {tt('The plan reminder appears once per week unless a paid subscription is active.')}
        </div>
      </div>
    </div>
  );
}
