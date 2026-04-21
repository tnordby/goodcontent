/** Kanban columns for the dashboard content pipeline (maps `briefs.phase`). */
export const CONTENT_PIPELINE_COLUMNS = [
  {
    id: "planning",
    title: "Planning",
    description: "Brief through outline",
    phases: ["brief", "research", "outline"],
  },
  {
    id: "interview",
    title: "Interview",
    description: "Guest link & answers",
    phases: ["interview"],
  },
  {
    id: "drafting",
    title: "Drafting",
    description: "AI draft & edits",
    phases: ["draft", "edit"],
  },
  {
    id: "review",
    title: "Review",
    description: "Approval & polish",
    phases: ["review"],
  },
  {
    id: "published",
    title: "Published",
    description: "Shipped to HubSpot",
    phases: ["pushed"],
  },
] as const;

export type ContentPipelineColumnId =
  (typeof CONTENT_PIPELINE_COLUMNS)[number]["id"];

export const PUBLISHED_PIPELINE_COLUMN_ID: ContentPipelineColumnId = "published";

/** Columns shown on the dashboard board (optionally hides shipped work). */
export function pipelineColumnsForDashboard(includePublished: boolean) {
  if (includePublished) {
    return [...CONTENT_PIPELINE_COLUMNS];
  }
  return CONTENT_PIPELINE_COLUMNS.filter(
    (c) => c.id !== PUBLISHED_PIPELINE_COLUMN_ID,
  );
}

export function briefPhaseToPipelineColumnId(
  phase: string,
): ContentPipelineColumnId {
  for (const col of CONTENT_PIPELINE_COLUMNS) {
    if ((col.phases as readonly string[]).includes(phase)) {
      return col.id;
    }
  }
  return "planning";
}
