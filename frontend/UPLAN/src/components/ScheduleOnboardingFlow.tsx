import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Download,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';

type Step = 'intent' | 'preferences' | 'generation' | 'results';
type IntentKey = 'less-stress' | 'free-days' | 'no-early-classes' | 'balanced-workload';
type BreakTolerance = 'compact' | 'spaced';
type CommuteBand = '0-15' | '15-30' | '30-45' | '45+';

type ScheduleSession = {
  id: string;
  day: string;
  course: string;
  start: string;
  end: string;
  type: 'lecture' | 'lab' | 'seminar';
};

type GeneratedSchedule = {
  sessions: ScheduleSession[];
  freeDays: string[];
  insightChips: string[];
  explanation: string;
  stats: {
    earliestStart: string;
    busiestDay: string;
    totalDaysWithClasses: number;
  };
};

type OnboardingPreferences = {
  wakeUpTime: number;
  maxClassesPerDay: 3 | 4 | 5;
  breakTolerance: BreakTolerance;
  includeCommute: boolean;
  commuteBand: CommuteBand;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaveSchedule?: (schedule: GeneratedSchedule) => void;
  onExportCalendar?: (schedule: GeneratedSchedule) => void;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const GENERATION_LINES = [
  'Designing your perfect week',
  'Avoiding early classes',
  'Optimizing your energy',
  'Balancing your workload',
  'Reducing long gaps',
];

const INTENT_OPTIONS: Array<{
  id: IntentKey;
  title: string;
  body: string;
}> = [
  {
    id: 'less-stress',
    title: 'Less stress',
    body: 'Lighter transitions, fewer rough days, and a calmer weekly pace.',
  },
  {
    id: 'free-days',
    title: 'Free days',
    body: 'Concentrate classes into fewer days and protect one day when possible.',
  },
  {
    id: 'no-early-classes',
    title: 'No early classes',
    body: 'Push the first class later and avoid difficult mornings.',
  },
  {
    id: 'balanced-workload',
    title: 'Balanced workload',
    body: 'Spread class density more evenly so the week feels predictable.',
  },
];

const WAKE_PRESETS = [
  { label: 'Before 7:00', value: 390 },
  { label: '7:00 to 8:00', value: 450 },
  { label: '8:00 to 9:00', value: 510 },
  { label: 'After 9:00', value: 570 },
] as const;

const COMMUTE_OPTIONS: Array<{ label: string; value: CommuteBand }> = [
  { label: '0 to 15 min', value: '0-15' },
  { label: '15 to 30 min', value: '15-30' },
  { label: '30 to 45 min', value: '30-45' },
  { label: '45 min or more', value: '45+' },
];

const baseSessions: ScheduleSession[] = [
  { id: '1', day: 'Monday', course: 'Algorithms', start: '10:00', end: '11:15', type: 'lecture' },
  { id: '2', day: 'Monday', course: 'Linear Algebra', start: '12:00', end: '13:15', type: 'seminar' },
  { id: '3', day: 'Tuesday', course: 'Databases', start: '09:30', end: '10:45', type: 'lecture' },
  { id: '4', day: 'Tuesday', course: 'Databases Lab', start: '13:00', end: '14:45', type: 'lab' },
  { id: '5', day: 'Wednesday', course: 'Software Engineering', start: '10:30', end: '11:45', type: 'lecture' },
  { id: '6', day: 'Wednesday', course: 'UX Systems', start: '14:00', end: '15:15', type: 'seminar' },
  { id: '7', day: 'Thursday', course: 'Statistics', start: '11:00', end: '12:15', type: 'lecture' },
  { id: '8', day: 'Thursday', course: 'Statistics Lab', start: '13:00', end: '14:30', type: 'lab' },
  { id: '9', day: 'Friday', course: 'Networks', start: '09:00', end: '10:15', type: 'lecture' },
  { id: '10', day: 'Friday', course: 'Product Studio', start: '12:30', end: '14:00', type: 'seminar' },
];

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const toTimeLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const getWakePresetLabel = (value: number) => {
  let match = WAKE_PRESETS[0];
  let distance = Math.abs(WAKE_PRESETS[0].value - value);

  WAKE_PRESETS.forEach((preset) => {
    const nextDistance = Math.abs(preset.value - value);
    if (nextDistance < distance) {
      match = preset;
      distance = nextDistance;
    }
  });

  return match.label;
};

const addMinutes = (time: string, minutesToAdd: number) => toTimeLabel(toMinutes(time) + minutesToAdd);

const generateSchedule = (intent: IntentKey, preferences: OnboardingPreferences, version: number): GeneratedSchedule => {
  const sessions = baseSessions
    .map((session, index) => {
      const wakeAdjustment = preferences.wakeUpTime >= 510 ? 60 : preferences.wakeUpTime >= 450 ? 30 : 0;
      const compactAdjustment = preferences.breakTolerance === 'compact' ? -15 : 20;
      const versionAdjustment = version % 2 === 0 ? 0 : (index % 2 === 0 ? 15 : -15);
      let shift = compactAdjustment + versionAdjustment;

      if (intent === 'no-early-classes') shift += wakeAdjustment + 45;
      if (intent === 'less-stress') shift += 30;
      if (intent === 'balanced-workload' && (session.day === 'Tuesday' || session.day === 'Thursday')) shift += 15;
      if (intent === 'free-days' && session.day === 'Friday') shift += 120;

      const commutePadding =
        preferences.includeCommute && (session.type === 'lab' || session.type === 'seminar')
          ? preferences.commuteBand === '45+'
            ? 30
            : preferences.commuteBand === '30-45'
              ? 20
              : preferences.commuteBand === '15-30'
                ? 10
                : 0
          : 0;

      const startMinutes = Math.max(510, toMinutes(session.start) + shift + commutePadding);
      const duration = toMinutes(session.end) - toMinutes(session.start);

      return {
        ...session,
        start: toTimeLabel(startMinutes),
        end: toTimeLabel(startMinutes + duration),
      };
    })
    .filter((session) => {
      if (intent !== 'free-days') return true;
      return session.day !== 'Friday';
    });

  const sessionsByDay = DAYS.reduce<Record<string, ScheduleSession[]>>((acc, day) => {
    acc[day] = sessions
      .filter((session) => session.day === day)
      .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
      .slice(0, preferences.maxClassesPerDay);
    return acc;
  }, {});

  const freeDays = DAYS.filter((day) => sessionsByDay[day].length === 0);
  const classCounts = DAYS.map((day) => sessionsByDay[day].length);
  const earliestSession = sessions
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))[0];
  const busiestDay = DAYS.reduce((best, day) =>
    sessionsByDay[day].length > sessionsByDay[best].length ? day : best, 'Monday'
  );

  const chips: string[] = [];
  if (freeDays.length > 0) chips.push(`${freeDays.length} free ${freeDays.length === 1 ? 'day' : 'days'}`);
  if (toMinutes(earliestSession?.start || '09:00') >= 540) chips.push(`No classes before ${earliestSession.start}`);
  if (Math.max(...classCounts) - Math.min(...classCounts.filter((count) => count > 0)) <= 1) chips.push('Balanced across the week');

  if (intent === 'free-days' && freeDays.length === 0) {
    chips.unshift('Priority tuned for tighter class days');
  }

  const explanationByIntent: Record<IntentKey, string> = {
    'less-stress': 'This schedule reduces rough transitions, softens heavy days, and keeps the week easier to manage.',
    'free-days': 'This schedule concentrates classes into fewer days and protects open space for study, work, or recovery.',
    'no-early-classes': 'This schedule minimizes gaps and avoids early mornings so your first class starts later.',
    'balanced-workload': 'This schedule spreads your classes more evenly so no single day carries too much weight.',
  };

  return {
    sessions,
    freeDays,
    insightChips: chips.slice(0, 3),
    explanation: explanationByIntent[intent],
    stats: {
      earliestStart: earliestSession?.start || '09:00',
      busiestDay,
      totalDaysWithClasses: DAYS.length - freeDays.length,
    },
  };
};

const scheduleBlockTone: Record<ScheduleSession['type'], string> = {
  lecture: 'bg-slate-950 text-white dark:bg-white dark:text-slate-950',
  lab: 'bg-blue-600 text-white dark:bg-blue-500',
  seminar: 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
};

export default function ScheduleOnboardingFlow({
  open,
  onClose,
  onSaveSchedule,
  onExportCalendar,
}: Props) {
  const [step, setStep] = useState<Step>('intent');
  const [intent, setIntent] = useState<IntentKey | null>(null);
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    wakeUpTime: 510,
    maxClassesPerDay: 4,
    breakTolerance: 'compact',
    includeCommute: false,
    commuteBand: '15-30',
  });
  const [generationLineIndex, setGenerationLineIndex] = useState(0);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);

  useEffect(() => {
    if (!open || step !== 'generation' || !intent) return;

    const lineTimer = window.setInterval(() => {
      setGenerationLineIndex((current) => (current + 1) % GENERATION_LINES.length);
    }, 850);

    const generateTimer = window.setTimeout(() => {
      setGeneratedSchedule(generateSchedule(intent, preferences, regenerationCount));
      setStep('results');
    }, 3600);

    return () => {
      window.clearInterval(lineTimer);
      window.clearTimeout(generateTimer);
    };
  }, [open, step, intent, preferences, regenerationCount]);

  useEffect(() => {
    if (!open) return;
    setGenerationLineIndex(0);
  }, [open, step]);

  const progressValue = useMemo(() => {
    if (step === 'intent') return 20;
    if (step === 'preferences') return 45;
    if (step === 'generation') return 72;
    return 100;
  }, [step]);

  const summaryText = useMemo(() => {
    const commuteText = preferences.includeCommute ? `, commute ${preferences.commuteBand}` : '';
    return `${getWakePresetLabel(preferences.wakeUpTime)}, max ${preferences.maxClassesPerDay} classes, ${
      preferences.breakTolerance === 'compact' ? 'compact days' : 'more spacing'
    }${commuteText}`;
  }, [preferences]);

  const handleStartGeneration = () => {
    if (!intent) return;
    setStep('generation');
  };

  const handleRegenerate = () => {
    if (!intent) return;
    setRegenerationCount((current) => current + 1);
    setGenerationLineIndex(0);
    setStep('generation');
  };

  const renderHeader = () => (
    <div className="border-b border-slate-200 px-5 pb-5 pt-6 dark:border-slate-800 sm:px-7">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
            AI Schedule Setup
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">
            Generate a stronger university week in under 30 seconds
          </h2>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Close onboarding flow"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-5 space-y-2">
        <Progress value={progressValue} className="h-1.5 bg-slate-200 dark:bg-slate-800" indicatorColor="bg-blue-700 dark:bg-blue-400" />
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Instant setup</span>
          <span>{step === 'results' ? 'Ready' : 'In progress'}</span>
        </div>
      </div>
    </div>
  );

  const renderIntentStep = () => (
    <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Step 1
          </p>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
            What matters most to you?
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Pick one priority and the schedule will be shaped around it immediately.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {INTENT_OPTIONS.map((option) => {
            const selected = intent === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setIntent(option.id)}
                className={`rounded-lg border p-5 text-left transition ${
                  selected
                    ? 'border-blue-600 bg-blue-50 shadow-sm dark:border-blue-500 dark:bg-blue-950/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-950 dark:text-white">{option.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{option.body}</p>
                  </div>
                  {selected && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white dark:bg-blue-500">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Clear and fast</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              No course form yet. Start with the outcome you want.
            </p>
          </div>
          <Button
            onClick={() => setStep('preferences')}
            disabled={!intent}
            className="h-11 rounded-md bg-blue-700 px-5 text-white hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Build around this
          </Button>
        </div>
      </section>

      <aside className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Live preview
        </p>
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Selected priority
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
              {intent ? INTENT_OPTIONS.find((option) => option.id === intent)?.title : 'Choose one priority'}
            </p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">What the AI will optimize</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Class timing, day density, transitions, and overall weekly balance.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Expected outcome</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                A complete weekly schedule that feels intentional instead of random.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );

  const renderPreferenceStep = () => (
    <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Step 2
          </p>
          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
            A few quick preferences
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            These take a few seconds and make the generated week feel personal.
          </p>
        </div>

        <div className="grid gap-4">
          <Card className="rounded-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-950 dark:text-white">When do you usually start your day?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {WAKE_PRESETS.map((preset) => {
                  const selected = getWakePresetLabel(preferences.wakeUpTime) === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPreferences((current) => ({ ...current, wakeUpTime: preset.value }))}
                      className={`rounded-md border px-3 py-3 text-sm font-medium transition ${
                        selected
                          ? 'border-blue-600 bg-blue-50 text-slate-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Fine-tune start preference</span>
                  <span className="font-semibold text-slate-950 dark:text-white">{toTimeLabel(preferences.wakeUpTime)}</span>
                </div>
                <Slider
                  value={[preferences.wakeUpTime]}
                  min={360}
                  max={660}
                  step={15}
                  onValueChange={([next]) => setPreferences((current) => ({ ...current, wakeUpTime: next }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-lg border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-950 dark:text-white">What feels manageable in one day?</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setPreferences((current) => ({ ...current, maxClassesPerDay: count as 3 | 4 | 5 }))}
                    className={`rounded-md border px-3 py-3 text-base font-semibold transition ${
                      preferences.maxClassesPerDay === count
                        ? 'border-blue-600 bg-blue-50 text-slate-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-950 dark:text-white">How should the day feel?</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {[
                  { id: 'compact', label: 'Compact day', body: 'Less idle time, tighter blocks' },
                  { id: 'spaced', label: 'More spaced', body: 'More room between classes' },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPreferences((current) => ({ ...current, breakTolerance: option.id as BreakTolerance }))}
                    className={`rounded-md border p-3 text-left transition ${
                      preferences.breakTolerance === option.id
                        ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{option.label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{option.body}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-950 dark:text-white">Optional commute time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() =>
                  setPreferences((current) => ({ ...current, includeCommute: !current.includeCommute }))
                }
                className="rounded-md"
              >
                <Clock3 className="mr-2 h-4 w-4" />
                {preferences.includeCommute ? 'Hide commute' : 'Add commute time'}
              </Button>

              {preferences.includeCommute && (
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {COMMUTE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPreferences((current) => ({ ...current, commuteBand: option.value }))}
                      className={`rounded-md border px-3 py-3 text-sm font-medium transition ${
                        preferences.commuteBand === option.value
                          ? 'border-blue-600 bg-blue-50 text-slate-950 dark:border-blue-500 dark:bg-blue-950/30 dark:text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <aside className="space-y-4">
        <Card className="rounded-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-950 dark:text-white">Smart summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline" className="rounded-md px-3 py-1 text-sm">
              {intent ? INTENT_OPTIONS.find((option) => option.id === intent)?.title : 'Priority pending'}
            </Badge>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{summaryText}</p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg text-slate-950 dark:text-white">What will change</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            <p>Wake-up time influences the earliest class target.</p>
            <p>Class-per-day limit controls how dense each day can become.</p>
            <p>Break style changes whether the week feels tight or more open.</p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setStep('intent')}
            className="h-11 rounded-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleStartGeneration}
            className="h-11 flex-1 rounded-md bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Generate my week
          </Button>
        </div>
      </aside>
    </div>
  );

  const renderGenerationStep = () => (
    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Step 3
        </p>
        <h3 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
          {GENERATION_LINES[generationLineIndex]}
        </h3>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          This usually takes a moment. The schedule is being arranged around your selected priorities.
        </p>
        <div className="mt-6 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin text-blue-700 dark:text-blue-400" />
          <span>{summaryText}</span>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="grid grid-cols-5 gap-3">
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="space-y-3">
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                {day.slice(0, 3)}
              </div>
              <div className="space-y-2">
                {Array.from({ length: dayIndex === 4 && intent === 'free-days' ? 1 : 3 }).map((_, blockIndex) => (
                  <div
                    key={`${day}-${blockIndex}`}
                    className="h-20 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/70"
                    style={{ animationDelay: `${(dayIndex + blockIndex) * 140}ms` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderResultsStep = () => {
    if (!generatedSchedule) return null;

    const sessionsByDay = DAYS.reduce<Record<string, ScheduleSession[]>>((acc, day) => {
      acc[day] = generatedSchedule.sessions
        .filter((session) => session.day === day)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
      return acc;
    }, {});

    return (
      <div className="grid gap-5 p-5 sm:p-7">
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Step 4
            </p>
            <h3 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
              Your week is ready
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Best match for your priorities. The full schedule is ready immediately and can be refined later.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {generatedSchedule.insightChips.map((chip) => (
                <Badge key={chip} variant="outline" className="rounded-md px-3 py-1 text-sm">
                  {chip}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Free days
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {generatedSchedule.freeDays.length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Earliest class
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {generatedSchedule.stats.earliestStart}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Busiest day
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {generatedSchedule.stats.busiestDay}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-950 dark:text-white">{generatedSchedule.explanation}</p>
          </div>
          <div className="grid gap-0 lg:grid-cols-5">
            {DAYS.map((day) => {
              const daySessions = sessionsByDay[day];
              const isFreeDay = generatedSchedule.freeDays.includes(day);
              return (
                <div key={day} className="min-h-[320px] border-b border-slate-200 p-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">{day}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {daySessions.length > 0 ? `${daySessions.length} classes` : 'Open day'}
                      </p>
                    </div>
                    {isFreeDay && (
                      <Badge className="rounded-md bg-blue-700 px-2 py-1 text-white dark:bg-blue-500">Free</Badge>
                    )}
                  </div>
                  <div className="mt-4 space-y-3">
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        className={`rounded-md p-3 ${scheduleBlockTone[session.type]}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{session.course}</p>
                            <p className="mt-1 text-xs opacity-80">{session.type}</p>
                          </div>
                          <span className="text-xs font-semibold opacity-90">
                            {session.start}
                          </span>
                        </div>
                        <p className="mt-3 text-xs opacity-80">{session.start} to {session.end}</p>
                      </div>
                    ))}
                    {daySessions.length === 0 && (
                      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                        No classes scheduled.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm font-medium text-slate-950 dark:text-white">Why this works</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            The week was arranged around your selected priority first, then refined using wake-up time, daily class limit, and spacing preferences.
          </p>
        </section>

        <Separator />

        <section className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            You can tweak details later. This gets you started now.
          </p>
          <Button
            variant="outline"
            onClick={handleRegenerate}
            className="h-11 rounded-md"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => generatedSchedule && onExportCalendar?.(generatedSchedule)}
              className="h-11 rounded-md"
            >
              <Download className="mr-2 h-4 w-4" />
              Export to calendar
            </Button>
            <Button
              onClick={() => generatedSchedule && onSaveSchedule?.(generatedSchedule)}
              className="h-11 rounded-md bg-blue-700 px-5 text-white hover:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Save schedule
            </Button>
          </div>
        </section>
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 px-3 py-5 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        {renderHeader()}

        {step === 'intent' && renderIntentStep()}
        {step === 'preferences' && renderPreferenceStep()}
        {step === 'generation' && renderGenerationStep()}
        {step === 'results' && renderResultsStep()}

        <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              <span>Everything is optimized for speed, clarity, and low-friction decisions.</span>
            </div>
            <span>No long form. No dead end. No empty state.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { GeneratedSchedule, IntentKey, OnboardingPreferences };
