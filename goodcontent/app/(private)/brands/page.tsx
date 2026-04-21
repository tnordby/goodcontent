"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import styles from "./brands.module.css";

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitComma(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function BrandsPage() {
  const brandsQuery = useQuery(api.brands.listByCurrentWorkspace);
  const brands = useMemo(() => brandsQuery ?? [], [brandsQuery]);
  const createBrand = useMutation(api.brands.create);
  const updateBrand = useMutation(api.brands.update);
  const setPrimary = useMutation(api.brands.setPrimary);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "primary">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    website: "",
    tagline: "",
    elevatorPitch: "",
    missionStatement: "",
    productsText: "",
    targetMarket: "",
    industriesText: "",
    companySizesText: "",
    geographiesText: "",
    jobsToBeDoneText: "",
    personasText: "",
    toneDefault: "",
    brandVoice: "",
    sayInsteadText: "",
    doNotSayText: "",
    competitorsText: "",
    sourceUrlsText: "",
    logoUrl: "",
    primaryColor: "",
    secondaryColorsText: "",
    typography: "",
    imageStyleNotes: "",
    isPrimary: false,
  });

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 1 &&
      /^https?:\/\//i.test(form.website.trim())
    );
  }, [form.name, form.website]);

  const resetForm = () => {
    setEditingId(null);
    setIsEditorOpen(false);
    setForm({
      name: "",
      website: "",
      tagline: "",
      elevatorPitch: "",
      missionStatement: "",
      productsText: "",
      targetMarket: "",
      industriesText: "",
      companySizesText: "",
      geographiesText: "",
      jobsToBeDoneText: "",
      personasText: "",
      toneDefault: "",
      brandVoice: "",
      sayInsteadText: "",
      doNotSayText: "",
      competitorsText: "",
      sourceUrlsText: "",
      logoUrl: "",
      primaryColor: "",
      secondaryColorsText: "",
      typography: "",
      imageStyleNotes: "",
      isPrimary: false,
    });
  };

  const startEdit = (brand: (typeof brands)[number]) => {
    setIsEditorOpen(true);
    setEditingId(String(brand._id));
    setForm({
      name: brand.name,
      website: brand.website,
      tagline: brand.tagline ?? "",
      elevatorPitch: brand.elevatorPitch ?? "",
      missionStatement: brand.missionStatement ?? "",
      productsText: brand.products
        .map(
          (p) =>
            `${p.name} | ${p.description} | ${p.differentiators.join(", ")} | ${p.useCases.join(", ")} | ${p.canonicalUrl ?? ""}`
        )
        .join("\n"),
      targetMarket: brand.icp.targetMarket ?? "",
      industriesText: brand.icp.industries.join("\n"),
      companySizesText: brand.icp.companySizes.join("\n"),
      geographiesText: brand.icp.geographies.join("\n"),
      jobsToBeDoneText: brand.icp.jobsToBeDone.join("\n"),
      personasText: brand.icp.personas
        .map(
          (p) =>
            `${p.title} | ${p.painPoints.join(", ")} | ${p.desiredOutcomes.join(", ")}`
        )
        .join("\n"),
      toneDefault: brand.toneDefault ?? "",
      brandVoice: brand.brandVoice ?? "",
      sayInsteadText: brand.sayInstead
        .map((pair) => `${pair.instead} => ${pair.say}`)
        .join("\n"),
      doNotSayText: brand.doNotSay.join(", "),
      competitorsText: brand.competitors
        .map((c) => `${c.name} | ${c.positioningNote ?? ""}`)
        .join("\n"),
      sourceUrlsText: brand.sourceUrls.join("\n"),
      logoUrl: brand.visual.logoUrl ?? "",
      primaryColor: brand.visual.primaryColor ?? "",
      secondaryColorsText: brand.visual.secondaryColors.join(", "),
      typography: brand.visual.typography ?? "",
      imageStyleNotes: brand.visual.imageStyleNotes ?? "",
      isPrimary: brand.isPrimary,
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    try {
      const products = splitLines(form.productsText)
        .map((line) => {
          const [name, description, differentiators, useCases, canonicalUrl] = line
            .split("|")
            .map((part) => part.trim());
          if (!name || !description) return null;
          return {
            name,
            description,
            differentiators: splitComma(differentiators ?? ""),
            useCases: splitComma(useCases ?? ""),
            canonicalUrl: canonicalUrl || undefined,
          };
        })
        .filter((item): item is NonNullable<typeof item> => !!item);

      const personas = splitLines(form.personasText)
        .map((line) => {
          const [title, painPoints, desiredOutcomes] = line
            .split("|")
            .map((part) => part.trim());
          if (!title) return null;
          return {
            title,
            painPoints: splitComma(painPoints ?? ""),
            desiredOutcomes: splitComma(desiredOutcomes ?? ""),
          };
        })
        .filter((item): item is NonNullable<typeof item> => !!item);

      const sayInstead = splitLines(form.sayInsteadText)
        .map((line) => {
          const [instead, say] = line.split("=>").map((part) => part.trim());
          if (!instead || !say) return null;
          return { instead, say };
        })
        .filter((item): item is NonNullable<typeof item> => !!item);

      const competitors = splitLines(form.competitorsText)
        .map((line) => {
          const [name, positioningNote] = line
            .split("|")
            .map((part) => part.trim());
          if (!name) return null;
          return { name, positioningNote: positioningNote || undefined };
        })
        .filter((item): item is NonNullable<typeof item> => !!item);

      const payload = {
        name: form.name.trim(),
        website: form.website.trim(),
        tagline: form.tagline.trim() || undefined,
        elevatorPitch: form.elevatorPitch.trim() || undefined,
        missionStatement: form.missionStatement.trim() || undefined,
        products,
        icp: {
          targetMarket: form.targetMarket.trim() || undefined,
          industries: splitLines(form.industriesText),
          companySizes: splitLines(form.companySizesText),
          geographies: splitLines(form.geographiesText),
          jobsToBeDone: splitLines(form.jobsToBeDoneText),
          personas,
        },
        brandVoice: form.brandVoice.trim() || undefined,
        toneDefault: form.toneDefault.trim() || undefined,
        sayInstead,
        doNotSay: splitComma(form.doNotSayText),
        competitors,
        visual: {
          logoUrl: form.logoUrl.trim() || undefined,
          primaryColor: form.primaryColor.trim() || undefined,
          secondaryColors: splitComma(form.secondaryColorsText),
          typography: form.typography.trim() || undefined,
          imageStyleNotes: form.imageStyleNotes.trim() || undefined,
        },
        sourceUrls: splitLines(form.sourceUrlsText),
        isPrimary: form.isPrimary,
      };

      if (editingId) {
        await updateBrand({ brandId: editingId as Id<"brands">, ...payload });
        toast.success("Brand profile updated");
      } else {
        await createBrand(payload);
        toast.success("Brand profile created");
      }

      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save brand");
    } finally {
      setIsSaving(false);
    }
  };

  const rows = useMemo(() => {
    return brands
      .filter((brand) => {
        if (tab === "primary" && !brand.isPrimary) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          brand.name.toLowerCase().includes(q) ||
          brand.website.toLowerCase().includes(q) ||
          (brand.icp.targetMarket ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [brands, search, tab]);

  const allSelected =
    rows.length > 0 && rows.every((brand) => selected[String(brand._id)]);
  const selectedCount = Object.values(selected).filter(Boolean).length;

  const counts = useMemo(() => {
    return {
      all: brands.length,
      primary: brands.filter((b) => b.isPrimary).length,
    };
  }, [brands]);

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 p-4 md:p-6">
      <div className={styles.head}>
        <div>
          <h1>Company</h1>
          <p>One company profile per workspace with brand intelligence and ICP context.</p>
        </div>
        <div className={styles.headMeta}>
          <b>{counts.all}</b> total · <b>{counts.primary}</b> primary
        </div>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Company tabs">
        <button className={tab === "all" ? styles.on : ""} onClick={() => setTab("all")}>
          All <span className={styles.cnt}>{counts.all}</span>
        </button>
        <button
          className={tab === "primary" ? styles.on : ""}
          onClick={() => setTab("primary")}
        >
          Primary <span className={styles.cnt}>{counts.primary}</span>
        </button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className={styles.ic}>⌕</span>
          <input
            placeholder="Search company, website, target market..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <kbd>/</kbd>
        </label>
        <button className={styles.filter} type="button">
          <span className={styles.lbl}>Scope</span>
          <b>Workspace</b>
          <span className={styles.caret}>▾</span>
        </button>
        <div className={styles.toolbarRight}>
          <Button size="sm" type="button" variant="outline">
            Export
          </Button>
          <Button size="sm" type="button" variant="outline">
            View
          </Button>
          <Button
            size="sm"
            type="button"
            onClick={() => {
              setIsEditorOpen((prev) => !prev);
              if (editingId) setEditingId(null);
            }}
          >
            {isEditorOpen ? "Close" : "+ New company"}
          </Button>
        </div>
      </div>

      {isEditorOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit company profile" : "Create company profile"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Company name</Label>
                  <Input
                    id="brandName"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandWebsite">Website</Label>
                  <Input
                    id="brandWebsite"
                    placeholder="https://example.com"
                    value={form.website}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, website: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productsText">
                  Products/services (one per line: name | description | differentiators | use cases | url)
                </Label>
                <Textarea
                  id="productsText"
                  rows={5}
                  value={form.productsText}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, productsText: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetMarket">Target market / ICP summary</Label>
                <Textarea
                  id="targetMarket"
                  rows={3}
                  value={form.targetMarket}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, targetMarket: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personasText">
                  Personas (one per line: title | pain points (comma) | desired outcomes (comma))
                </Label>
                <Textarea
                  id="personasText"
                  rows={4}
                  value={form.personasText}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, personasText: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industries">Industries (one per line)</Label>
                  <Textarea
                    id="industries"
                    rows={3}
                    value={form.industriesText}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, industriesText: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySizes">Company sizes (one per line)</Label>
                  <Textarea
                    id="companySizes"
                    rows={3}
                    value={form.companySizesText}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, companySizesText: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brandVoice">Brand voice</Label>
                  <Textarea
                    id="brandVoice"
                    rows={3}
                    value={form.brandVoice}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, brandVoice: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toneDefault">Default tone</Label>
                  <Input
                    id="toneDefault"
                    value={form.toneDefault}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, toneDefault: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button disabled={!canSubmit || isSaving} type="submit">
                  {isSaving ? "Saving..." : editingId ? "Update brand" : "Create brand"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className={styles.tableWrap}>
        <div className={`${styles.row} ${styles.header}`}>
          <button
            className={`${styles.check} ${allSelected ? styles.checkOn : ""}`}
            aria-label="Select all"
            onClick={() => {
              if (allSelected) {
                setSelected({});
                return;
              }
              const next: Record<string, boolean> = {};
              rows.forEach((brand) => {
                next[String(brand._id)] = true;
              });
              setSelected(next);
            }}
          >
            ✓
          </button>
          <span>Company</span>
          <span>Type</span>
          <span>Status</span>
          <span>Owner</span>
          <span>Personas</span>
          <span>Updated</span>
          <span />
        </div>
        <div className={styles.body}>
          {rows.length === 0 ? (
            <div className={styles.empty}>No company profiles match your filters.</div>
          ) : (
            rows.map((brand) => (
              <div key={brand._id} className={styles.row}>
                <button
                  className={`${styles.check} ${selected[String(brand._id)] ? styles.checkOn : ""}`}
                  aria-label="Select row"
                  onClick={() =>
                    setSelected((prev) => ({
                      ...prev,
                      [String(brand._id)]: !prev[String(brand._id)],
                    }))
                  }
                >
                  ✓
                </button>
                <div className={styles.titleWrap}>
                  <div className={styles.title}>
                    {brand.name}
                    {brand.isPrimary ? " · primary" : ""}
                  </div>
                  <div className={styles.subtitle}>
                    {brand.website}
                    {!brand.isPrimary ? (
                      <>
                        <span>·</span>
                        <button
                          type="button"
                          className={styles.inlineLink}
                          onClick={() =>
                            setPrimary({ brandId: brand._id }).then(() =>
                              toast.success("Primary company updated")
                            )
                          }
                        >
                          Set primary
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className={styles.type}>
                  <span className={styles.glyph}>▢</span>
                  <span className={styles.name}>Company</span>
                </div>
                <div className={styles.stage}>
                  <span
                    className={styles.dot}
                    style={{ background: brand.isPrimary ? "#0f9f55" : "#8f8778" }}
                  />
                  <span>{brand.isPrimary ? "Primary" : "Secondary"}</span>
                  <span className={styles.pb}>
                    <i style={{ width: brand.isPrimary ? "95%" : "45%" }} />
                  </span>
                </div>
                <div className={styles.owner}>
                  <span className={styles.av}>GC</span>
                  <span className={styles.who}>
                    {brand.icp.targetMarket || "Workspace"}
                  </span>
                </div>
                <div className={styles.lang}>{brand.icp.personas.length}</div>
                <div className={styles.updated}>
                  {formatDistanceToNow(brand.updatedAt, { addSuffix: true })}
                </div>
                <button
                  className={styles.menuBtn}
                  aria-label="Edit company"
                  type="button"
                  onClick={() => startEdit(brand)}
                >
                  ⋯
                </button>
              </div>
            ))
          )}
        </div>
        <div className={styles.tableFoot}>
          <span>
            {selectedCount > 0 ? (
              <>
                <b>{selectedCount}</b> selected · bulk actions available
              </>
            ) : (
              <>
                Showing <b>{rows.length}</b> of <b>{counts.all}</b> company profiles
              </>
            )}
          </span>
          <div className={styles.pager}>
            <button type="button">‹</button>
            <span className={styles.here}>1 / 1</span>
            <button type="button">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

