"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_ABOUT_SETTINGS,
  getAboutSettings,
  updateAboutSettings,
  type AboutContent,
  type AboutSettings,
} from "@/lib/about-settings";
import type { Language } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TABS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা (Bangla)" },
];

type FieldDef = { key: keyof AboutContent; label: string; multiline?: boolean };

const FIELD_GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Hero",
    fields: [
      { key: "heroTitle", label: "Hero title" },
      { key: "heroSubtitle", label: "Hero subtitle" },
      { key: "heroBody", label: "Hero body", multiline: true },
    ],
  },
  {
    title: "Overview",
    fields: [
      { key: "overviewTitle", label: "Overview title" },
      { key: "overviewP1", label: "Paragraph 1", multiline: true },
      { key: "overviewP2", label: "Paragraph 2", multiline: true },
      { key: "overviewP3", label: "Paragraph 3", multiline: true },
    ],
  },
  {
    title: "Badges",
    fields: [
      { key: "badgeFreeToPost", label: "Badge 1" },
      { key: "badgeDirectChat", label: "Badge 2" },
      { key: "badgeNoMiddleman", label: "Badge 3" },
      { key: "badgeBoost", label: "Badge 4" },
    ],
  },
  {
    title: "Mission & Vision",
    fields: [
      { key: "missionTitle", label: "Mission title" },
      { key: "missionBody", label: "Mission body", multiline: true },
      { key: "visionTitle", label: "Vision title" },
      { key: "visionBody", label: "Vision body", multiline: true },
    ],
  },
  {
    title: "How it works",
    fields: [
      { key: "howItWorksTitle", label: "Section title" },
      { key: "howItWorksSubtitle", label: "Section subtitle" },
      { key: "step1Title", label: "Step 1 title" },
      { key: "step1Body", label: "Step 1 body", multiline: true },
      { key: "step2Title", label: "Step 2 title" },
      { key: "step2Body", label: "Step 2 body", multiline: true },
      { key: "step3Title", label: "Step 3 title" },
      { key: "step3Body", label: "Step 3 body", multiline: true },
    ],
  },
  {
    title: "Call to action",
    fields: [
      { key: "ctaTitle", label: "CTA title" },
      { key: "ctaButton", label: "CTA button text" },
    ],
  },
];

export default function AdminAboutPage() {
  const [settings, setSettings] = useState<AboutSettings>(DEFAULT_ABOUT_SETTINGS);
  const [activeTab, setActiveTab] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getAboutSettings()
      .then(setSettings)
      .finally(() => setIsLoading(false));
  }, []);

  function updateField(key: keyof AboutContent, value: string) {
    setSettings((current) => ({
      ...current,
      [activeTab]: { ...current[activeTab], [key]: value },
    }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateAboutSettings(settings);
      toast({ title: "About page updated" });
    } catch {
      toast({ title: "Could not save changes", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-blue-950">About Us Page</CardTitle>
          <CardDescription>
            Controls every section of the public About Us page — hero, overview, badges, mission
            &amp; vision, how-it-works steps, and the call-to-action. Edit English and Bangla
            separately; visitors see whichever matches their selected language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading About page content...
            </div>
          ) : (
            <>
              <div className="flex gap-2 border-b border-blue-100">
                {TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                      activeTab === tab.value
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-gray-500 hover:text-blue-600"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {FIELD_GROUPS.map((group) => (
                <section key={group.title} className="space-y-4">
                  <h3 className="text-sm font-semibold text-blue-950">{group.title}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {group.fields.map((field) => (
                      <div
                        key={field.key}
                        className={cn("space-y-2", field.multiline && "sm:col-span-2")}
                      >
                        <Label htmlFor={`${activeTab}-${field.key}`}>{field.label}</Label>
                        {field.multiline ? (
                          <Textarea
                            id={`${activeTab}-${field.key}`}
                            value={settings[activeTab][field.key]}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            rows={3}
                            placeholder={DEFAULT_ABOUT_SETTINGS[activeTab][field.key]}
                          />
                        ) : (
                          <Input
                            id={`${activeTab}-${field.key}`}
                            value={settings[activeTab][field.key]}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            placeholder={DEFAULT_ABOUT_SETTINGS[activeTab][field.key]}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
