"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./new-brief-modal.module.css";

export type NewBriefTypeOption = {
  value: string;
  label: string;
  description: string;
  glyph: string;
  available?: boolean;
};

type StepTwoTemplate = {
  fields: Array<{
    key: string;
    label: string;
    placeholder: string;
    multiline?: boolean;
    required?: boolean;
    mapTo: "title" | "topic" | "keywords" | "tone" | "sources";
  }>;
};

const STEP_TWO_BY_TYPE: Record<string, StepTwoTemplate> = {
  blog_post: {
    fields: [
      {
        key: "workingTitle",
        label: "Working title",
        placeholder: "e.g. How RevOps teams scale onboarding with fewer resources",
        required: true,
        mapTo: "title",
      },
      {
        key: "primaryAngle",
        label: "Primary angle",
        placeholder: "What is the single insight or POV this blog should deliver?",
        multiline: true,
        required: true,
        mapTo: "topic",
      },
      {
        key: "seoKeywords",
        label: "Primary SEO keywords",
        placeholder: "e.g. revops onboarding playbook, demand gen alignment",
        mapTo: "keywords",
      },
      {
        key: "tone",
        label: "Tone preference",
        placeholder: "e.g. Practical, no-nonsense, operator to operator",
        mapTo: "tone",
      },
    ],
  },
  case_study: {
    fields: [
      {
        key: "caseTitle",
        label: "Case study title",
        placeholder: "e.g. How Acme reduced churn by 32% in 90 days",
        required: true,
        mapTo: "title",
      },
      {
        key: "problemJourney",
        label: "Customer problem and journey",
        placeholder: "Describe the starting problem and solution journey to highlight.",
        multiline: true,
        required: true,
        mapTo: "topic",
      },
      {
        key: "outcomeMetric",
        label: "Outcome metrics",
        placeholder: "e.g. 32% lower churn, 18% faster onboarding",
        mapTo: "keywords",
      },
      {
        key: "proofLink",
        label: "Proof source URL (optional)",
        placeholder: "https://...",
        mapTo: "sources",
      },
    ],
  },
  customer_story: {
    fields: [
      {
        key: "storyTitle",
        label: "Story title",
        placeholder: "e.g. Why Nordic Telecom switched in two weeks",
        required: true,
        mapTo: "title",
      },
      {
        key: "narrativeFocus",
        label: "Narrative focus",
        placeholder: "What transformation or customer moment should the story center on?",
        multiline: true,
        required: true,
        mapTo: "topic",
      },
      {
        key: "quoteTheme",
        label: "Customer quote/theme",
        placeholder: "e.g. It felt effortless to launch",
        mapTo: "keywords",
      },
    ],
  },
  guide: {
    fields: [
      {
        key: "guideTitle",
        label: "Guide title",
        placeholder: "e.g. The 7-step enterprise migration checklist",
        required: true,
        mapTo: "title",
      },
      {
        key: "guideObjective",
        label: "Guide objective",
        placeholder: "What should the reader be able to do after reading this guide?",
        multiline: true,
        required: true,
        mapTo: "topic",
      },
      {
        key: "targetReader",
        label: "Target reader",
        placeholder: "e.g. IT leaders at mid-market B2B companies",
        mapTo: "keywords",
      },
    ],
  },
  landing_page: {
    fields: [
      {
        key: "landingTitle",
        label: "Page title",
        placeholder: "e.g. Better Forecasting for Revenue Teams",
        required: true,
        mapTo: "title",
      },
      {
        key: "campaignFocus",
        label: "Campaign focus",
        placeholder: "What offer, product, or campaign is this landing page promoting?",
        multiline: true,
        required: true,
        mapTo: "topic",
      },
      {
        key: "cta",
        label: "Primary CTA",
        placeholder: "e.g. Book a 30-minute demo",
        mapTo: "keywords",
      },
    ],
  },
  web_page: {
    fields: [
      {
        key: "pageTitle",
        label: "Page title",
        placeholder: "e.g. About GoodContent",
        required: true,
        mapTo: "title",
      },
      {
        key: "pagePurpose",
        label: "Page purpose",
        placeholder: "What core message should this web page communicate?",
        multiline: true,
        required: true,
        mapTo: "topic",
      },
      {
        key: "audienceContext",
        label: "Audience context",
        placeholder: "e.g. Buyers comparing content operations platforms",
        mapTo: "keywords",
      },
    ],
  },
  email: {
    fields: [
      {
        key: "emailTitle",
        label: "Email title",
        placeholder: "e.g. New feature launch: interview insights",
        required: true,
        mapTo: "title",
      },
      {
        key: "emailMessage",
        label: "Email message",
        placeholder: "What one message should this email communicate?",
        multiline: true,
        required: true,
        mapTo: "topic",
      },
      {
        key: "emailCta",
        label: "CTA",
        placeholder: "e.g. Activate the feature",
        mapTo: "keywords",
      },
    ],
  },
  sales_collateral: {
    fields: [
      {
        key: "collateralTitle",
        label: "Collateral title",
        placeholder: "e.g. GoodContent ROI one-pager",
        required: true,
        mapTo: "title",
      },
      {
        key: "salesNarrative",
        label: "Sales narrative",
        placeholder: "What objections and proof points should this collateral address?",
        multiline: true,
        required: true,
        mapTo: "topic",
      },
      {
        key: "buyerStage",
        label: "Buyer stage",
        placeholder: "e.g. Late-stage evaluation",
        mapTo: "keywords",
      },
    ],
  },
};

type Props = {
  open: boolean;
  onClose: () => void;
  onContinue: (payload: {
    contentType: string;
    title: string;
    topic: string;
    keywords: string;
    tone: string;
    sources: string;
  }) => void;
  options: readonly NewBriefTypeOption[];
  initialSelected?: string;
};

export function NewBriefModal({
  open,
  onClose,
  onContinue,
  options,
  initialSelected,
}: Props) {
  const [selected, setSelected] = useState(initialSelected ?? options[0]?.value ?? "");
  const [step, setStep] = useState<1 | 2>(1);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const resetLocalState = useCallback(() => {
    setStep(1);
    setFieldValues({});
    setSelected(initialSelected ?? options[0]?.value ?? "");
  }, [initialSelected, options]);

  const handleClose = useCallback(() => {
    resetLocalState();
    onClose();
  }, [onClose, resetLocalState]);

  const filtered = useMemo(() => {
    return options;
  }, [options]);
  const selectedOption = options.find((o) => o.value === selected);
  const canContinue = !!selected && selectedOption?.available !== false;
  const template = STEP_TWO_BY_TYPE[selected] ?? STEP_TWO_BY_TYPE.blog_post;
  const requiredFields = template.fields.filter((field) => field.required);
  const canFinish = requiredFields.every((field) => {
    const value = (fieldValues[field.key] ?? "").trim();
    if (field.mapTo === "title") return value.length > 2;
    if (field.mapTo === "topic") return value.length > 5;
    return value.length > 0;
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
      if (event.key === "Enter" && step === 1 && selected) {
        event.preventDefault();
        if (!canContinue) return;
        setStep(2);
      } else if (event.key === "Enter" && step === 2 && canFinish) {
        event.preventDefault();
        const payload = {
          contentType: selected,
          title: "",
          topic: "",
          keywords: "",
          tone: "",
          sources: "",
        };
        for (const field of template.fields) {
          const value = (fieldValues[field.key] ?? "").trim();
          if (!value) continue;
          if (field.mapTo === "keywords") {
            payload.keywords = payload.keywords
              ? `${payload.keywords}, ${value}`
              : value;
            continue;
          }
          if (field.mapTo === "sources") {
            payload.sources = payload.sources
              ? `${payload.sources}\n${value}`
              : value;
            continue;
          }
          payload[field.mapTo] = payload[field.mapTo]
            ? `${payload[field.mapTo]}\n${value}`
            : value;
        }
        onContinue({
          contentType: payload.contentType,
          title: payload.title,
          topic: payload.topic,
          keywords: payload.keywords,
          tone: payload.tone,
          sources: payload.sources,
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canContinue, canFinish, fieldValues, handleClose, onContinue, open, selected, step, template.fields]);

  if (!open) return null;

  return (
    <div className={styles.scrim} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.head}>
          <div className={styles.headLeft}>
            <div className={styles.progressInline}>
              <div className={styles.progressTrack}>
                <i style={{ width: step === 1 ? "25%" : "50%" }} />
              </div>
            </div>
            <h1>What are we making?</h1>
          </div>
          <button className={styles.close} aria-label="Close" onClick={handleClose} type="button">
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {step === 1 ? (
            <div className={styles.grid}>
              {filtered.map((t) => (
                <button
                  key={t.value}
                  className={`${styles.card} ${selected === t.value ? styles.on : ""}`}
                  onClick={() => setSelected(t.value)}
                  type="button"
                >
                  <div className={styles.glyph}>{t.glyph}</div>
                  <div className={styles.title}>{t.label}</div>
                  <div className={styles.desc}>{t.description}</div>
                  <div className={styles.check}>✓</div>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.stepTwo}>
              <div className={styles.stepTwoHead}>
                <p className={styles.stepTwoKicker}>Step 2 · Brief details</p>
                <p className={styles.stepTwoType}>{selectedOption?.label ?? "Selected type"}</p>
              </div>
              {template.fields.map((field) => (
                <label className={styles.field} key={field.key}>
                  <span>{field.label}</span>
                  {field.multiline ? (
                    <textarea
                      value={fieldValues[field.key] ?? ""}
                      onChange={(event) =>
                        setFieldValues((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      rows={4}
                    />
                  ) : (
                    <input
                      value={fieldValues[field.key] ?? ""}
                      onChange={(event) =>
                        setFieldValues((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className={styles.foot}>
          <div className={styles.footHint}>
            <kbd>↵</kbd> Continue · <kbd>Esc</kbd> Cancel
          </div>
          {step === 2 ? (
            <button className={styles.btn} onClick={() => setStep(1)} type="button">
              Back
            </button>
          ) : null}
          <button className={styles.btn} onClick={handleClose} type="button">
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={step === 1 ? !canContinue : !canFinish}
            onClick={() => {
              if (step === 1) {
                if (!canContinue) return;
                setStep(2);
                return;
              }
              const payload = {
                contentType: selected,
                title: "",
                topic: "",
                keywords: "",
                tone: "",
                sources: "",
              };
              for (const field of template.fields) {
                const value = (fieldValues[field.key] ?? "").trim();
                if (!value) continue;
                if (field.mapTo === "keywords") {
                  payload.keywords = payload.keywords
                    ? `${payload.keywords}, ${value}`
                    : value;
                  continue;
                }
                if (field.mapTo === "sources") {
                  payload.sources = payload.sources
                    ? `${payload.sources}\n${value}`
                    : value;
                  continue;
                }
                payload[field.mapTo] = payload[field.mapTo]
                  ? `${payload[field.mapTo]}\n${value}`
                  : value;
              }
              onContinue({
                contentType: payload.contentType,
                title: payload.title,
                topic: payload.topic,
                keywords: payload.keywords,
                tone: payload.tone,
                sources: payload.sources,
              });
              resetLocalState();
            }}
            type="button"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

