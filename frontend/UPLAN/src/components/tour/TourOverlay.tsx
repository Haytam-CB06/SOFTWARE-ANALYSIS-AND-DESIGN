import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useTour, TourStep } from '../../contexts/TourContext';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

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
    title: 'tourOverlay.steps.profile.title',
    body: 'tourOverlay.steps.profile.body',
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
    title: 'tourOverlay.steps.settings.title',
    body: 'tourOverlay.steps.settings.body',
    placement: 'right',
    align: 'right',
  },
  {
    page: 'create-timetable',
    selector: '[data-tour="create-timetable-details"]',
    title: 'tourOverlay.steps.studyWindow.title',
    highlightOffsetY: -64,
    body: 'tourOverlay.steps.studyWindow.body',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'create-timetable',
    selector: '[data-tour="create-course-setup"]',
    title: 'tourOverlay.steps.classSchedule.title',
    highlightOffsetY: -64,
    body: 'tourOverlay.steps.classSchedule.body',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'create-timetable',
    selector: '[data-tour="create-timetable-summary"]',
    title: 'tourOverlay.steps.busyTime.title',
    body: 'tourOverlay.steps.busyTime.body',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'create-timetable',
    selector: '[data-tour="create-generate"]',
    title: 'tourOverlay.steps.generate.title',
    body: 'tourOverlay.steps.generate.body',
    placement: 'top',
    align: 'center',
    highlightPad: 10,
  },
  {
    page: 'my-timetable',
    // Step 8 quick-fix: avoid focusing the timetable grid (it can be scroll/virtualized and produce a 1px highlight).
    // The sidebar highlight is enough context for this step.
    selector: '[data-tour="sidebar-my-timetable"]',
    title: 'tourOverlay.steps.timetable.title',
    body: 'tourOverlay.steps.timetable.body',
    placement: 'right',
    align: 'right',
  },
  {
    page: 'dashboard',
    selector: '[data-tour="dashboard-today-panel"]',
    title: 'tourOverlay.steps.today.title',
    highlightOffsetY: -56,
    body: 'tourOverlay.steps.today.body',
    // Keep the message clearly visible without covering the big "Today" panel.
    placement: 'top',
    align: 'center',
  },
  {
    page: 'dashboard',
    selector: '[data-tour="sidebar-assessments-deadlines"]',
    title: 'tourOverlay.steps.assessments.title',
    body: 'tourOverlay.steps.assessments.body',
    placement: 'right',
    align: 'right',
  },
  // Final section (kept short): Goals & Achievements
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-this-week"]',
    title: 'tourOverlay.steps.goalsWeek.title',
    body: 'tourOverlay.steps.goalsWeek.body',
    placement: 'bottom',
    align: 'left',
  },
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-upcoming-deadlines"]',
    title: 'tourOverlay.steps.deadlines.title',
    highlightOffsetY: -56,
    body: 'tourOverlay.steps.deadlines.body',
    placement: 'bottom',
    align: 'left',
  },
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-progress-streak"]',
    title: 'tourOverlay.steps.progress.title',
    body: 'tourOverlay.steps.progress.body',
    placement: 'bottom',
    align: 'left',
  },
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-today-session"]',
    title: 'tourOverlay.steps.todaySession.title',
    body: 'tourOverlay.steps.todaySession.body',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'goals-achievements',
    selector: '[data-tour="goals-weekly-goals"]',
    title: 'tourOverlay.steps.weeklyGoals.title',
    body: 'tourOverlay.steps.weeklyGoals.body',
    placement: 'top',
    align: 'center',
  },
  {
    page: 'workspace',
    // Highlight the *header region* (blue bar) as requested.
    selector: '[data-tour="workspace-header-region"]',
    title: 'tourOverlay.steps.workspace.title',
    body: 'tourOverlay.steps.workspace.body',
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

function fallbackSelectorForStep(step: TourStep) {
  const sidebar = `[data-tour="sidebar-${step.page}"]`;
  if (document.querySelector(sidebar)) return sidebar;
  if (document.querySelector('main')) return 'main';
  return 'body';
}

function renderRichText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-slate-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function pageLabel(page?: string) {
  switch (page) {
    case 'dashboard':
      return 'tourOverlay.pages.dashboard';
    case 'settings':
      return 'tourOverlay.pages.settings';
    case 'create-timetable':
      return 'tourOverlay.pages.autoGenerate';
    case 'my-timetable':
      return 'tourOverlay.pages.myTimetable';
    case 'goals-achievements':
      return 'tourOverlay.pages.goals';
    case 'workspace':
      return 'tourOverlay.pages.workspace';
    default:
      return 'tourOverlay.pages.default';
  }
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
  const { t } = useTranslation();

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

    setTargetRect(null);
    setCardPos(null);

    // Trigger navigation first (keeps overlay mounted).
    if (onNavigate && step.page) {
      onNavigate(step.page);
    }

    // Then wait for the target to appear and measure it.
    (async () => {
      let el = await waitForSelector(step.selector, cancelled);
      if (cancelled()) return;

      if (!el) {
        const fallbackSelector = fallbackSelectorForStep(step);
        el = document.querySelector(fallbackSelector) as HTMLElement | null;
      }

      if (!el) return;

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
  }, [active, resolvedCurrent?.page, resolvedCurrent?.selector, onNavigate]);

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

    // Keep a stable card size so the UI doesn't jitter between steps.
    const CARD_W = Math.min(420, Math.max(316, vw * 0.92));
    const CARD_H = 318;

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
  const currentProgressStep = clamp(stepIndex + 1 + progressOffset, 1, progressTotal);
  const progressPct = Math.max(6, Math.round((currentProgressStep / progressTotal) * 100));

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
      case 'create-timetable':
        return '[data-tour="sidebar-create-timetable"]';
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
      {/* Backdrop + spotlight (dim + blur everywhere except the target) */}
      <div className="absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(2,6,23,0.52)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
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
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 18px 42px rgba(0,0,0,0.24), 0 0 0 4px rgba(59,130,246,0.14)',
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
          width: 'min(92vw, 420px)',
          height: '318px',
          left: cardPos?.left ?? '50%',
          top: cardPos?.top ?? '50%',
          transform: cardPos ? 'none' : 'translate(-50%, -50%)',
        }}
      >
        <Card
          className="h-full gap-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.34)] animate-[tour-card-enter_220ms_cubic-bezier(.2,.9,.2,1)] dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="relative border-b border-slate-100 px-5 pb-4 pt-5 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4 pr-9">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  {t(pageLabel(resolvedCurrent?.page))}
                </div>
                <h3 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.025em] text-slate-950 dark:text-white">
                  {resolvedCurrent?.title ? t(resolvedCurrent.title) : t('tourOverlay.title')}
                </h3>
              </div>

              <div className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                {currentProgressStep}/{progressTotal}
              </div>
            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out dark:bg-blue-400"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <button
              onClick={closeTour}
              className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={t('tourOverlay.actions.close')}
            >
              <X className="h-4 w-4" />
              <span>{t('tourOverlay.actions.skip')}</span>
            </button>
          </div>

          <CardContent className="flex flex-1 flex-col px-5 pb-5 pt-4">
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {resolvedCurrent?.body ? renderRichText(t(resolvedCurrent.body)) : ''}
              </p>

              <div className="mt-4 flex items-start gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>{t('tourOverlay.note')}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button variant="outline" onClick={closeTour} className="rounded-md border-slate-300 bg-white px-4 text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                {t('tourOverlay.actions.skip')}
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={prev} disabled={isFirst} className="rounded-md">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('common.back')}
                </Button>

                <Button
                  className="rounded-md bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  onClick={(e) => {
                    // Make sure this click does not pass through to underlying UI.
                    e.preventDefault();
                    e.stopPropagation();
                    if (isLast) {
                      toast.success(t('tourOverlay.success'));
                      closeTour();
                    }
                    else next();
                  }}
                >
                  {isLast ? t('tourOverlay.actions.done') : t('common.next')}
                  {!isLast && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <style>{`
        @keyframes tour-card-enter {
          from { opacity: 0; transform: translateY(8px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 1ms !important;
          }
        }
      `}</style>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
}
