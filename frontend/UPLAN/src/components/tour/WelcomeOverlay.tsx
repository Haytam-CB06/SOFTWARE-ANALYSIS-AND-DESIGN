import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

type Props = {
  open: boolean;
  title?: string;
  body?: string;
  imageSrc: string;
  /** Optional onboarding progress label (e.g. step 1/17). */
  currentStep?: number;
  totalSteps?: number;
  onNext: () => void;
  onSkip?: () => void;
};

export default function WelcomeOverlay({ open, title, body, imageSrc, currentStep, totalSteps, onNext, onSkip }: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  const node = (
    <div
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: 2147483647 }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.70), rgba(15,23,42,0.82))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.40)] animate-[uplan-welcome-in_300ms_cubic-bezier(.2,.9,.2,1)] dark:border-slate-800 dark:bg-slate-950">
          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative min-h-[260px] overflow-hidden bg-slate-950">
              <img
                src={imageSrc}
                alt={t('welcomeOverlay.alt')}
                className="h-full min-h-[260px] w-full object-cover opacity-75"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" />
              <div className="absolute bottom-5 left-5 right-5">
                <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md">
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  {t('welcomeOverlay.badge')}
                </div>
                <p className="mt-4 max-w-sm text-xl font-semibold tracking-[-0.02em] text-white">
                  {t('welcomeOverlay.headline')}
                </p>
              </div>
            </div>

            <div className="relative p-5 sm:p-7">
            {onSkip && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSkip();
                }}
                  className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label={t('welcomeOverlay.close')}
              >
                <X className="h-4 w-4" />
                <span>{t('common.skip')}</span>
              </button>
            )}

              <div className="pr-10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                  {typeof currentStep === 'number' && typeof totalSteps === 'number'
                    ? `${t('welcomeOverlay.step')} ${currentStep} / ${totalSteps}`
                    : t('welcomeOverlay.alt')}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-4xl">
                  {title ?? t('app.welcome.title')}
                </h2>
              </div>

              <p className="mt-5 whitespace-pre-line text-base leading-7 text-slate-600 dark:text-slate-300">
              {body ??
                t('welcomeOverlay.body')}
            </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  t('welcomeOverlay.cards.profile'),
                  t('welcomeOverlay.cards.schedule'),
                  t('welcomeOverlay.cards.progress'),
                ].map((item) => (
                  <div key={item} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
                    <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-7">
                {typeof currentStep === 'number' && typeof totalSteps === 'number'
                  ? (
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-700 transition-all duration-500 dark:bg-blue-500"
                        style={{ width: `${Math.max(8, Math.min(100, (currentStep / totalSteps) * 100))}%` }}
                      />
                    </div>
                  )
                  : null}
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              {onSkip && (
                <Button
                  variant="outline"
                    className="rounded-md border-slate-300 bg-white px-4 text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  onSkip();
                  }}
                >
                  {t('common.skip')}
                </Button>
              )}

              <Button
                  className="rounded-md bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNext();
                }}
              >
                {t('common.next')}
                  <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes uplan-welcome-in {
          from { opacity: 0; transform: translateY(10px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
