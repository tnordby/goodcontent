/** Labels for `briefs.contentType` (Convex). */
export const CONTENT_TYPE_LABEL: Record<string, string> = {
  blog_post: "Blog post",
  case_study: "Case study",
  customer_story: "Customer story",
  guide: "Guide",
  landing_page: "Landing page",
  web_page: "Web page",
  email: "Email",
  sales_collateral: "Sales collateral",
};

export function contentTypeLabel(type: string): string {
  return CONTENT_TYPE_LABEL[type] ?? type.replace(/_/g, " ");
}

/** Labels for `interviews.status`. */
export const INTERVIEW_STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting guest",
  in_progress: "In progress",
  completed: "Submitted",
  expired: "Expired",
  failed: "Failed",
};

export function interviewStatusLabel(status: string): string {
  return INTERVIEW_STATUS_LABEL[status] ?? status;
}
