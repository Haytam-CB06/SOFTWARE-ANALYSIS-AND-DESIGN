import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

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
  if (!open) return null;

  const node = (
    <div
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: 2147483647 }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Blur + dim everything behind */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background: 'rgba(2, 6, 23, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Centered welcome card */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl bg-white dark:bg-slate-950 border border-white/30 dark:border-white/15 ring-4 ring-white/80 dark:ring-white/30 shadow-[0_22px_80px_rgba(0,0,0,0.55)]">
          <CardHeader className="relative">
            <CardTitle className="pr-10 text-3xl leading-tight">
              {title ?? 'Welcome to U PLAN 🎉'}
            </CardTitle>
            {onSkip && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSkip();
                }}
                className="absolute right-3 top-3 rounded-md p-2 hover:bg-muted"
                aria-label="Close welcome"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-2xl overflow-hidden border border-slate-200/70 dark:border-white/10">
              <img
                src={imageSrc}
                alt="Welcome"
                className="w-full h-[180px] sm:h-[210px] object-cover"
                draggable={false}
              />
            </div>

            <p className="text-lg sm:text-xl leading-relaxed text-slate-900 dark:text-slate-50 whitespace-pre-line">
              {body ??
                'We’ll guide you through the essentials in a quick walkthrough so you can generate a clean study timetable in minutes.'}
            </p>

            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {typeof currentStep === 'number' && typeof totalSteps === 'number'
                  ? `Step ${currentStep} / ${totalSteps}`
                  : null}
              </div>

              <div className="flex items-center justify-end gap-2">
              {onSkip && (
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSkip();
                  }}
                >
                  Skip
                </Button>
              )}

              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNext();
                }}
              >
                Next
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
