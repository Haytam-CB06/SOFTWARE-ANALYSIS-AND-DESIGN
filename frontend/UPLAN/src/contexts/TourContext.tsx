import React, { createContext, useContext, useMemo, useState } from 'react';

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

// Step-locked card positioning.
// Kept separate from `placement` to avoid jittery "best fit" recalculation.
export type TourAlign = 'left' | 'center' | 'right';

export type TourHighlightShape = 'rect' | 'circle';

/**
 * Step schema (scaffolding):
 * - page: intended logical page route/key (ex: "workspace")
 * - selector: CSS selector for the target element (NOT wired yet in checkpoint-02)
 * - title/body: copy shown in the floating card
 * - placement: where the card should appear relative to the target (placeholder for now)
 */
export type TourStep = {
  page: string;
  selector: string;
  title: string;
  body: string;
  placement?: TourPlacement;
  /**
   * Locks the onboarding card's horizontal anchor for this step.
   * - left: inside the content area (never under the sidebar)
   * - center: centered within the content area (excluding sidebar)
   * - right: snaps to the right edge
   */
  align?: TourAlign;
  /**
   * How the spotlight should look around the target.
   * - rect: rounded rectangle (default)
   * - circle: circular highlight (best for avatars / icon buttons)
   */
  highlightShape?: TourHighlightShape;
  /** Extra padding around the target element (px). Default is 8. */
  highlightPad?: number;
  /** Shift the spotlight box (px). Useful to create space for the tooltip card. */
  highlightOffsetX?: number;
  /** Shift the spotlight box (px). Useful to create space for the tooltip card. */
  highlightOffsetY?: number;
  /** Additional selectors to also punch out (multiple spotlights on a step). */
  extraSpotlightSelectors?: string[];
};

type TourContextValue = {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  currentStep: TourStep | null;
  open: (steps?: TourStep[], startIndex?: number) => void;
  close: () => void;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within <TourProvider />');
  return ctx;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);

  const open = (newSteps?: TourStep[], startIndex: number = 0) => {
    if (Array.isArray(newSteps) && newSteps.length > 0) {
      setSteps(newSteps);
      setStepIndex(Math.max(0, Math.min(startIndex, newSteps.length - 1)));
    } else {
      // No steps passed -> just activate whatever was already loaded.
      setStepIndex((i) => Math.max(0, Math.min(i, Math.max(steps.length - 1, 0))));
    }
    setActive(true);
  };

  const close = () => setActive(false);

  const next = () => {
    setStepIndex((i) => Math.min(i + 1, Math.max(steps.length - 1, 0)));
  };

  const prev = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const goTo = (index: number) => {
    setStepIndex(Math.max(0, Math.min(index, Math.max(steps.length - 1, 0))));
  };

  const value = useMemo<TourContextValue>(() => {
    const currentStep = steps[stepIndex] ?? null;
    return {
      active,
      stepIndex,
      steps,
      currentStep,
      open,
      close,
      next,
      prev,
      goTo,
    };
  }, [active, stepIndex, steps]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
