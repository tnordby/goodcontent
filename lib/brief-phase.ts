/** Human-readable labels for `briefs.phase` (Convex schema). */
export const BRIEF_PHASE_LABEL: Record<string, string> = {
  brief: "Brief",
  research: "Research",
  outline: "Outline",
  interview: "Interview",
  draft: "Draft",
  edit: "Editing",
  review: "Review",
  pushed: "Pushed",
};

export function briefPhaseLabel(phase: string): string {
  return BRIEF_PHASE_LABEL[phase] ?? phase;
}
