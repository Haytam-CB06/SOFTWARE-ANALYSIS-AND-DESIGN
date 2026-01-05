import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useTour, TourStep } from '../../contexts/TourContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

type Props = {
  /**
   * Uses the app's existing navigation handler (keeps ?page= behavior consistent).
   * Tour auto-navigates on every step change.
   */
  onNavigate?: (page: string) => void;

  /**
   * When true, the tour will auto-start once per mount.
   * Useful for first-time onboarding so users are immediately guided.
   */
  autoStart?: boolean;

  /**
   * Called when the tour is closed via Skip/Done/Close.
   * Use this to mark onboarding as completed in backend.
   */
  onFinishOnboarding?: () => void | Promise<void>;
};

// Tour v2 (sales-first): based on "floating overlay + circled target".
// NOTE: Selectors rely on data-tour attributes across the app.
// Exported so Help/Walkthrough can re-launch the same onboarding.
export const TOUR_STEPS: TourStep[] = [
  {
    page: 'dashboard',
    selector: '[data-tour="profile-dropdown"]',
    title: 'Your profile & settings',
    body: 'Tap your name/avatar to open Profile Settings. This is where you can edit your details and keep your account up to date.',
    placement: 'bottom',
    align: 'right',
    // NOTE: Rect highlight avoids an oversized circle around the whole top bar area.
    highlightShape: 'rect',
    highlightPad: 8,
  },
  {
    page: 'settings',
    // Step 2 should NOT focus the Edit Profile button (it can steal focus/click and cause the modal state to change).
    // Keep the user oriented via the sidebar only.
    selector: '[data-tour="sidebar-settings"]',
    title: 'Edit your profile',
    body: 'Open **Settings** from the sidebar, then use **Edit Profile** to update your name, bio, picture and other details.',
    placement: 'right',
    align: 'right',
  },
  {
    page: 'auto-generate',
    selector: '[data-tour="auto-study-window"]',
    title: 'Study Window',
    highlightOffsetY: -64,
    body: 'Set the time range you’re available to study. This guides the generator so your timetable matches your real routine (and exam periods).',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'auto-generate',
    selector: '[data-tour="auto-class-schedule"]',
    title: 'Class Schedule & Priority',
    highlightOffsetY: -64,
    body: 'Add your classes and set priority so important courses get better study coverage. You can edit this anytime.',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'auto-generate',
    selector: '[data-tour="auto-busy-time"]',
    title: 'Busy Time',
    body: 'Block out work, errands, or personal time. These become “busy blocks” so the generator won’t schedule sessions on top of them.',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'auto-generate',
    selector: '[data-tour="auto-shuffle"]',
    title: 'Shuffle',
    body: 'Shuffle gives a different layout while respecting your study window, classes, priorities, and busy time.',
    placement: 'top',
    align: 'center',
    highlightPad: 10,
  },
  {
    page: 'auto-generate',
    selector: '[data-tour="auto-generate"]',
    title: 'Generate',
    body: 'Generate creates your study sessions for the week based on all the rules you set above.',
    placement: 'top',
    align: 'center',
    highlightPad: 10,
  },
  {
    page: 'my-timetable',
    // Step 8 quick-fix: avoid focusing the timetable grid (it can be scroll/virtualized and produce a 1px highlight).
    // The sidebar highlight is enough context for this step.
    selector: '[data-tour="sidebar-my-timetable"]',
    title: 'My Timetable',
    body: 'This is your weekly study plan. You can drag & drop sessions and manually edit time blocks to perfect your routine.',
    placement: 'right',
    align: 'right',
  },
  {
    page: 'dashboard',
    selector: '[data-tour="dashboard-today-panel"]',
    title: 'Today’s sessions',
    highlightOffsetY: -56,
    body: 'Your day view keeps you on track. Start the current session and manage what you do next so you stay consistent.',
    // Keep the message clearly visible without covering the big "Today" panel.
    placement: 'top',
    align: 'center',
  },
  {
    page: 'dashboard',
    selector: '[data-tour="sidebar-assessments-deadlines"]',
    title: 'Assessments',
    body: 'Track your tests, exams, and assignments here. Deadlines automatically influence planning so busy weeks are protected.',
    placement: 'right',
    align: 'right',
  },
  // Final section (kept short): Goals & Achievements
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-this-week"]',
    title: 'This Week',
    body: 'See how many sessions you have scheduled this week (pulled from My Timetable).',
    placement: 'bottom',
    align: 'left',
  },
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-upcoming-deadlines"]',
    title: 'Upcoming deadlines',
    highlightOffsetY: -56,
    body: 'A quick view of what’s due soon so you can stay ahead.',
    placement: 'bottom',
    align: 'left',
  },
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-progress-streak"]',
    title: 'Progress & streak',
    body: 'Track completed hours and your streak. Consistency here is what builds long-term improvement.',
    placement: 'bottom',
    align: 'left',
  },
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-today-session"]',
    title: 'Today’s Session',
    body: 'See today’s sessions and expand to manage them in detail.',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-weekly-goals"]',
    title: 'Weekly goals & completions',
    body: 'Set weekly goals, keep your streak, and track completed deadlines as you progress.',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'workspace',
    // Highlight the *header region* (blue bar) as requested.
    selector: '[data-tour="workspace-header-region"]',
    title: 'Workspace header',
    body: 'This header shows your active Workspace, members, and quick actions. Use it to switch workspaces or create a new one, then use the tabs below to navigate within the workspace.',
    placement: 'bottom',
    align: 'center',
    highlightPad: 10,
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

function rectsIntersect(a: { left: number; top: number; right: number; bottom: number }, b: { left: number; top: number; right: number; bottom: number }) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function getRectFromSelector(selector: string): DOMRect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  return el.getBoundingClientRect();
}

type Spotlight = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
};

function toSpotlight(rect: DOMRect, pad: number, shape: TourStep['highlightShape'] = 'rect', offsetX: number = 0, offsetY: number = 0): Spotlight {
  const left = Math.max(0, rect.left - pad + offsetX);
  const top = Math.max(0, rect.top - pad + offsetY);
  const width = Math.max(0, rect.width + pad * 2);
  const height = Math.max(0, rect.height + pad * 2);

  if (shape === 'circle') {
    const size = Math.max(width, height);
    const cx = left + width / 2;
    const cy = top + height / 2;
    return {
      left: Math.max(0, cx - size / 2),
      top: Math.max(0, cy - size / 2),
      width: size,
      height: size,
      radius: size / 2,
    };
  }

  return {
    left,
    top,
    width,
    height,
    radius: 16,
  };
}

function buildMaskDataUrl(holes: Spotlight[], vw: number, vh: number) {
  // White = overlay visible, Black = cut-out (spotlight).
  const rects = holes
    .map((h) => `<rect x="${h.left}" y="${h.top}" width="${h.width}" height="${h.height}" rx="${h.radius}" ry="${h.radius}" fill="black"/>`)
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}">
      <mask id="m">
        <rect width="100%" height="100%" fill="white"/>
        ${rects}
      </mask>
      <rect width="100%" height="100%" fill="white" mask="url(#m)"/>
    </svg>
  `;

  const encoded = encodeURIComponent(svg).replace(/%0A/g, '');

  return `url("data:image/svg+xml,${encoded}")`;
}

async function waitForSelector(selector: string, cancelled: () => boolean) {
  // fast path
  const first = document.querySelector(selector) as HTMLElement | null;
  if (first) return first;

  // retry loop (requestAnimationFrame + small delay)
  for (let i = 0; i < 40; i++) {
    if (cancelled()) return null;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el) return el;
    await new Promise<void>((r) => setTimeout(() => r(), 80));
  }
  return null;
}

async function sleep(ms: number) {
  await new Promise<void>((r) => setTimeout(() => r(), ms));
}

export default function TourOverlay({ onNavigate, autoStart, onFinishOnboarding }: Props) {
  const { active, steps, stepIndex, currentStep, open, close, next, prev } = useTour();

  const resolvedSteps = useMemo(() => (steps.length > 0 ? steps : TOUR_STEPS), [steps.length]);
  const resolvedCurrent = useMemo(
    () => currentStep ?? resolvedSteps[stepIndex] ?? null,
    [currentStep, resolvedSteps, stepIndex]
  );

  const cardRef = useRef<HTMLDivElement | null>(null);
  const autoStartedRef = useRef(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null);
  // Card positioning is step-locked: we do NOT reflow on content changes to avoid jitter.
  const [viewportTick, setViewportTick] = useState(0);

  const closeTour = async () => {
    // Ensure we mark onboarding complete exactly once per closure.
    try {
      await onFinishOnboarding?.();
    } catch {
      // ignore (don't block closing UI)
    }
    // Badges are out-of-scope for now, but we hint the value prop right at the end.
    // (Toaster is currently configured globally.)
    toast.info('Tip: Study longer and stay consistent to unlock badges (coming soon).');
    close();
  };

  // Auto-start (once) when requested.
  useEffect(() => {
    if (!autoStart) return;
    if (active) return;
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    open(resolvedSteps, 0);
  }, [autoStart, active, open, resolvedSteps]);

  // NOTE: We intentionally do NOT lock scroll. The tour should feel like a
  // lightweight, floating hint (sales-first) rather than a blocking full-screen modal.

  // Keyboard support (ESC closes; arrows navigate steps)
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTour();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, closeTour, next, prev]);

  // On step change: auto-navigate, wait for DOM, then attach.
  useEffect(() => {
    if (!active || !resolvedCurrent) return;

    const step = resolvedCurrent;
    let cancelledFlag = false;
    const cancelled = () => cancelledFlag;

    // Trigger navigation first (keeps overlay mounted).
    if (onNavigate && step.page) {
      onNavigate(step.page);
    }

    // Then wait for the target to appear and measure it.
    (async () => {
      const el = await waitForSelector(step.selector, cancelled);
      if (cancelled()) return;

      if (!el) {
        setTargetRect(null);
        setCardPos(null);
        return;
      }

      // If target is outside viewport, bring it into view.
      try {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      } catch {
        // ignore
      }

      // Smooth scroll may take a moment; measure after it settles.
      // (This prevents the highlight from being far off on the first render.)
      await sleep(260);
      requestAnimationFrame(() => {
        if (cancelled()) return;
        setTargetRect(el.getBoundingClientRect());
      });
    })();

    return () => {
      cancelledFlag = true;
    };
  }, [active, resolvedCurrent?.page, resolvedCurrent?.selector]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-measure ONLY on screen resize.
  // We deliberately avoid scroll-driven reflow to prevent jitter.
  useEffect(() => {
    if (!active || !resolvedCurrent) return;
    const onResize = () => {
      const rect = getRectFromSelector(resolvedCurrent.selector);
      // If the target isn't present on this page, keep it blurred.
      setTargetRect(rect ?? null);
      setViewportTick((t) => t + 1);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, resolvedCurrent?.selector]);

  // Position the card using step-locked anchors:
  // - Horizontal position is driven by step.align (left/center/right)
  // - Layout respects SIDEBAR_WIDTH + TOPBAR_HEIGHT and never slides under them
  // - We only reflow on step change or screen resize (viewportTick)
  useLayoutEffect(() => {
    if (!active || !resolvedCurrent) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Keep a stable long-rectangle card size so the UI doesn't jitter.
    const CARD_W = Math.min(520, Math.max(320, vw * 0.94));
    // Slightly taller card so the final message fits without requiring scroll (Step 16/16 request).
    const CARD_H = 320;

    const margin = 16;

    const sidebarEl = document.querySelector('aside') as HTMLElement | null;
    const sidebarRect = sidebarEl?.getBoundingClientRect();
    const sidebarWidth = Math.max(0, sidebarRect?.width ?? 256);

    // Prefer the real top bar height (some pages render a separate top bar container).
    // We use the *bottom* edge so the card never tucks underneath it.
    const topbarEl =
      (document.querySelector('nav.sticky') as HTMLElement | null) ??
      (document.querySelector('header.sticky') as HTMLElement | null) ??
      (document.querySelector('[data-tour="topbar"]') as HTMLElement | null) ??
      (document.querySelector('header[role="banner"]') as HTMLElement | null) ??
      (document.querySelector('nav[aria-label="Top navigation"]') as HTMLElement | null);
    const topbarRect = topbarEl?.getBoundingClientRect();
    const topbarBottom = Math.max(0, topbarRect?.bottom ?? 64);

    const contentLeft = sidebarWidth + margin;
    const contentRight = vw - margin;
    const topMin = topbarBottom + margin;
    const topMax = vh - margin - CARD_H;

    const align = resolvedCurrent.align ?? (resolvedCurrent.placement === 'right' ? 'right' : resolvedCurrent.placement === 'left' ? 'left' : 'center');

    let left = contentLeft;
    if (align === 'center') {
      left = contentLeft + (contentRight - contentLeft) / 2 - CARD_W / 2;
    } else if (align === 'right') {
      left = contentRight - CARD_W;
    }
    left = clamp(left, contentLeft, Math.max(contentLeft, contentRight - CARD_W));

    // Vertical: prefer centering to the target, but never cover it.
    // Use the padded spotlight rect (not the raw target) for collision, so the card never
    // sits on the "focus" area.
    const padForCollision = (resolvedCurrent.highlightPad ?? 8) + 8;
    const collisionRect = targetRect
      ? {
          left: targetRect.left - padForCollision,
          top: targetRect.top - padForCollision,
          right: targetRect.right + padForCollision,
          bottom: targetRect.bottom + padForCollision,
        }
      : null;

    const tryTop = (t: number) => clamp(t, topMin, Math.max(topMin, topMax));
    const tryLeft = (l: number) => clamp(l, contentLeft, Math.max(contentLeft, contentRight - CARD_W));

    let top = vh / 2 - CARD_H / 2;
    if (targetRect) top = targetRect.top + targetRect.height / 2 - CARD_H / 2;
    top = tryTop(top);

    const intersects = (l: number, t: number) => {
      if (!collisionRect) return false;
      const cardBox = { left: l, top: t, right: l + CARD_W, bottom: t + CARD_H };
      return rectsIntersect(cardBox, collisionRect);
    };

    if (collisionRect && intersects(left, top)) {
      const gap = 24;
      // Prefer placing the card in available blurred space around the spotlight.
      // IMPORTANT: Respect the step's intended vertical direction so we don't end up
      // placing the tooltip "above" when the design expects it beneath (and vice versa).
      const candidates: Array<{ left: number; top: number }> = [];

      const posRight = {
        left: tryLeft(collisionRect.right + gap),
        top: tryTop(collisionRect.top + (collisionRect.bottom - collisionRect.top) / 2 - CARD_H / 2),
      };
      const posLeft = {
        left: tryLeft(collisionRect.left - gap - CARD_W),
        top: tryTop(collisionRect.top + (collisionRect.bottom - collisionRect.top) / 2 - CARD_H / 2),
      };
      const posBelow = { left, top: tryTop(collisionRect.bottom + gap) };
      const posAbove = { left, top: tryTop(collisionRect.top - gap - CARD_H) };

      const placement = resolvedCurrent.placement ?? 'center';
      if (placement === 'bottom') {
        candidates.push(posBelow, posRight, posLeft, posAbove);
      } else if (placement === 'top') {
        candidates.push(posAbove, posRight, posLeft, posBelow);
      } else if (placement === 'left') {
        candidates.push(posLeft, posAbove, posBelow, posRight);
      } else if (placement === 'right') {
        candidates.push(posRight, posAbove, posBelow, posLeft);
      } else {
        // center/default
        candidates.push(posRight, posLeft, posBelow, posAbove);
      }

      // Pick the first candidate that doesn't intersect.
      const pick = candidates.find((c) => !intersects(c.left, c.top));
      if (pick) {
        left = pick.left;
        top = pick.top;
      } else {
        // Deterministic fallback: push as far as possible away vertically.
        const preferAbove = collisionRect.top > vh * 0.55;
        top = preferAbove ? tryTop(collisionRect.top - gap - CARD_H) : tryTop(collisionRect.bottom + gap);
      }
    }

    setCardPos({ left: Math.round(left), top: Math.round(top) });
  }, [active, resolvedCurrent?.align, resolvedCurrent?.placement, targetRect, stepIndex, viewportTick]);

  if (!active) {
    const node = (
      <div className="fixed bottom-4 right-4" style={{ zIndex: 2147483647 }}>
        <Button
          variant="secondary"
          onClick={() => open(resolvedSteps, 0)}
          className="shadow-lg"
          aria-label="Start onboarding tour"
        >
          Start tour
        </Button>
      </div>
    );

    // Render into <body> so we always sit above any layout stacking contexts
    // (sidebar/topbar portals, transformed containers, etc.).
    return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
  }

  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= resolvedSteps.length - 1;

  // If the tour was auto-started from the Welcome screen, the Welcome counts as Step 1.
  // So the tour itself becomes steps 2..N+1.
  const progressOffset = autoStart ? 1 : 0;
  const progressTotal = resolvedSteps.length + progressOffset;

  // Spotlight behavior:
  // Keep ONLY 3 things "in focus" at any time:
  // 1) The current menu page item (sidebar),
  // 2) The target element for the step,
  // 3) The message card (already above the backdrop).
  // Everything else is dimmed + blurred.
  const pad = resolvedCurrent?.highlightPad ?? 8;
  const primarySpotlight = targetRect
    ? toSpotlight(targetRect, pad, resolvedCurrent?.highlightShape ?? 'rect', resolvedCurrent?.highlightOffsetX ?? 0, resolvedCurrent?.highlightOffsetY ?? 0)
    : null;

  const sidebarSelectorForPage = (page: string) => {
    switch (page) {
      case 'dashboard':
        return '[data-tour="sidebar-dashboard"]';
      case 'my-timetable':
        return '[data-tour="sidebar-my-timetable"]';
      case 'auto-generate':
        return '[data-tour="sidebar-auto-generate"]';
      case 'goals-achievements':
        return '[data-tour="sidebar-goals-achievements"]';
      case 'settings':
        return '[data-tour="sidebar-settings"]';
      default:
        return null;
    }
  };

  // If the step is *already* pointing to a sidebar item, do NOT also spotlight the current page.
  const stepTargetsSidebar = (resolvedCurrent?.selector ?? '').includes('sidebar-');
  const sidebarSelector = !stepTargetsSidebar && resolvedCurrent?.page
    ? sidebarSelectorForPage(resolvedCurrent.page)
    : null;
  const sidebarRect = sidebarSelector ? getRectFromSelector(sidebarSelector) : null;
  const sidebarSpotlight = sidebarRect ? toSpotlight(sidebarRect, 6, 'rect') : null;

  const extraSpotlights = (resolvedCurrent?.extraSpotlightSelectors ?? [])
    .map((sel) => getRectFromSelector(sel))
    .filter(Boolean)
    .map((r) => toSpotlight(r as DOMRect, pad, 'rect'));

  const spotlights = [primarySpotlight, sidebarSpotlight, ...extraSpotlights].filter(Boolean) as Spotlight[];

  const overlay = (
    // Block interactions behind the tour so clicks don't trigger random UI (e.g. Smart Insights).
    // The tooltip card itself remains fully interactive.
    <div
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: 2147483647 }}
      onMouseDown={(e) => {
        // Prevent bubbling into the app.
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Backdrop + spotlight (dim + blur everywhere EXCEPT the target) */}
      <div className="absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: 'var(--tour-backdrop)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            pointerEvents: 'none',
            WebkitMaskImage: spotlights.length
              ? buildMaskDataUrl(spotlights, window.innerWidth, window.innerHeight)
              : undefined,
            maskImage: spotlights.length
              ? buildMaskDataUrl(spotlights, window.innerWidth, window.innerHeight)
              : undefined,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
          }}
        />

        {/* Spotlight borders (menu + target) */}
        {spotlights.map((s, idx) => (
          <div
            key={idx}
            className="absolute"
            style={{
              left: s.left,
              top: s.top,
              width: s.width,
              height: s.height,
              borderRadius: s.radius,
              border: '2px solid var(--tour-highlight-border)',
              boxShadow: '0 10px 32px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      {/* Floating card (attached) */}
      <div
        ref={cardRef}
        className="absolute pointer-events-auto"
        style={{
          width: 'min(94vw, 520px)',
          height: '320px',
          left: cardPos?.left ?? '50%',
          top: cardPos?.top ?? '50%',
          transform: cardPos ? 'none' : 'translate(-50%, -50%)',
        }}
      >
        <Card
          // Opaque + "lit" so the explanation always reads as a primary focus (light & dark mode).
          className="bg-white dark:bg-slate-950 border border-white/30 dark:border-white/15 ring-4 ring-white/80 dark:ring-white/30 shadow-[0_22px_80px_rgba(0,0,0,0.55)] animate-[tour-pop_180ms_ease-out]"
        >
          <CardHeader className="relative">
            <CardTitle className="pr-8 text-3xl leading-tight">{resolvedCurrent?.title ?? 'Onboarding'}</CardTitle>
            <button
              onClick={closeTour}
              className="absolute right-3 top-3 rounded-md p-2 hover:bg-muted"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4" style={{ height: 'calc(320px - 96px)', overflowY: 'auto' }}>
            <p className="text-xl leading-relaxed text-slate-900 dark:text-slate-50">
              {resolvedCurrent?.body ?? ''}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Step {clamp(stepIndex + 1 + progressOffset, 1, progressTotal)} / {progressTotal}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={prev} disabled={isFirst}>
                  Back
                </Button>

                <Button
                  variant="outline"
                  onClick={closeTour}
                  aria-label="Skip onboarding"
                >
                  Skip
                </Button>

                <Button
                  onClick={(e) => {
                    // Make sure this click does not pass through to underlying UI.
                    e.preventDefault();
                    e.stopPropagation();
                    if (isLast) {
                      toast.info('Tip: Study longer to unlock badges (coming soon).');
                      closeTour();
                    }
                    else next();
                  }}
                >
                  {isLast ? 'Done' : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
}
