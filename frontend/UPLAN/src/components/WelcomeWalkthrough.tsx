import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Sparkles, ArrowRight, ArrowLeft, X } from 'lucide-react';

type Step = {
  title: string;
  description: string;
  tips?: string[];
};

interface WelcomeWalkthroughProps {
  userName?: string;
  onFinish: () => Promise<void> | void;
  onSkip: () => Promise<void> | void;
  onNavigate?: (page: string) => void;
}

export default function WelcomeWalkthrough({ userName, onFinish, onSkip, onNavigate }: WelcomeWalkthroughProps) {
  const { t } = useTranslation();

  const steps = useMemo<Step[]>(
    () => [
      {
        title: t('welcomeWalkthrough.steps.welcome.title'),
        description: t('welcomeWalkthrough.steps.welcome.description'),
        tips: [t('welcomeWalkthrough.steps.welcome.tips.0')],
      },
      {
        title: t('welcomeWalkthrough.steps.autoGenerate.title'),
        description: t('welcomeWalkthrough.steps.autoGenerate.description'),
        tips: [
          t('welcomeWalkthrough.steps.autoGenerate.tips.0'),
          t('welcomeWalkthrough.steps.autoGenerate.tips.1'),
        ],
      },
      {
        title: t('welcomeWalkthrough.steps.assessments.title'),
        description: t('welcomeWalkthrough.steps.assessments.description'),
        tips: [t('welcomeWalkthrough.steps.assessments.tips.0')],
      },
      {
        title: t('welcomeWalkthrough.steps.workspace.title'),
        description: t('welcomeWalkthrough.steps.workspace.description'),
        tips: [t('welcomeWalkthrough.steps.workspace.tips.0')],
      },
    ],
    [t]
  );

  const [idx, setIdx] = useState(0);
  const step = steps[idx];
  const isFirst = idx === 0;
  const isLast = idx === steps.length - 1;

  const goNext = async () => {
    if (isLast) {
      await onFinish();
      return;
    }
    setIdx((v) => Math.min(steps.length - 1, v + 1));
  };

  const goPrev = () => setIdx((v) => Math.max(0, v - 1));

  const quickNav = () => {
    // Optional shortcuts by step
    if (!onNavigate) return;
    if (idx === 1) onNavigate('auto-generate');
    if (idx === 2) onNavigate('assessments-deadlines');
    if (idx === 3) onNavigate('workspace');
  };

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <CardTitle>{step.title}</CardTitle>
          </div>
          <CardDescription>
            {userName ? t('welcomeWalkthrough.greeting', { name: userName }) : ''}
            {step.description}
          </CardDescription>

          <Button
            variant="outline"
            className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-md border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => onSkip()}
            title={t('welcomeWalkthrough.actions.skipWalkthrough')}
          >
            <X className="w-4 h-4" />
            <span>{t('welcomeWalkthrough.actions.skip')}</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">
              {t('welcomeWalkthrough.stepCounter', { current: idx + 1, total: steps.length })}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" onClick={quickNav} disabled={!onNavigate}>
                {t('welcomeWalkthrough.actions.openThisPage')}
              </Button>
              <Button variant="outline" onClick={() => onSkip()} className="border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                {t('welcomeWalkthrough.actions.skip')}
              </Button>
            </div>
          </div>

          {step.tips && step.tips.length > 0 && (
            <div className="rounded-2xl border p-3">
              <div className="text-sm font-medium mb-2">{t('welcomeWalkthrough.quickTips')}</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {step.tips.map((tItem) => (
                  <li key={tItem}>{tItem}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goPrev} disabled={isFirst}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
            <Button onClick={goNext}>
              {isLast ? t('welcomeWalkthrough.actions.finish') : t('welcomeWalkthrough.actions.next')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
