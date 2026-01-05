import { useMemo, useState } from 'react';
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
  const steps = useMemo<Step[]>(
    () => [
      {
        title: 'Welcome to U PLAN',
        description:
          'This quick walkthrough shows you where the important stuff is. You can skip anytime and come back later.',
        tips: ['Tip: you can refresh safely now — the app will keep your page.'],
      },
      {
        title: 'Auto-generate a study timetable',
        description:
          'Use Auto-Generate to build a weekly plan. You can shuffle to get a different result, or keep a seed to reproduce it.',
        tips: ['Try: Auto-Generate → Shuffle', 'Then: Save timetable → Apply to week'],
      },
      {
        title: 'Assessments & Deadlines',
        description:
          'Add deadlines/exams so the generator allocates more time to urgent courses — even when multiple exams happen in the same week.',
        tips: ['Try: add 2 exams in the same week and re-generate'],
      },
      {
        title: 'Workspace',
        description:
          'Workspaces let you collaborate with teammates using chat and shared planning.',
        tips: ['Chat updates live while you are on the chat page.'],
      },
    ],
    []
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
            {userName ? `Hi ${userName}. ` : ''}
            {step.description}
          </CardDescription>

          <Button
            variant="ghost"
            className="absolute right-3 top-3"
            onClick={() => onSkip()}
            title="Skip walkthrough"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">
              Step {idx + 1} / {steps.length}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" onClick={quickNav} disabled={!onNavigate}>
                Open this page
              </Button>
              <Button variant="outline" onClick={() => onSkip()}>
                Skip
              </Button>
            </div>
          </div>

          {step.tips && step.tips.length > 0 && (
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium mb-2">Quick tips</div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {step.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goPrev} disabled={isFirst}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={goNext}>
              {isLast ? 'Finish' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
