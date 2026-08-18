"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Language } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { getRulesAndRestrictions, updateRulesAndRestrictions } from "@/lib/rules";
import { cn } from "@/lib/utils";

const TABS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা (Bangla)" },
];

export default function AdminRulesPage() {
  const [content, setContent] = useState<Record<Language, string>>({ en: "", bn: "" });
  const [activeTab, setActiveTab] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([getRulesAndRestrictions("en"), getRulesAndRestrictions("bn")])
      .then(([en, bn]) => setContent({ en, bn }))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateRulesAndRestrictions(content);
      toast({ title: "Rules & Restrictions updated" });
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
          <CardTitle className="text-blue-950">Rules & Restrictions (বিধি নিষেধ)</CardTitle>
          <CardDescription>
            Shown to every visitor via a link in the site footer — separate from the signup Terms
            & Conditions. Users who have Bangla selected see the Bangla text below; everyone else
            sees the English text. Editing here updates it live for everyone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading current rules...
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
              <Textarea
                key={activeTab}
                value={content[activeTab]}
                onChange={(event) =>
                  setContent((prev) => ({ ...prev, [activeTab]: event.target.value }))
                }
                rows={20}
                className="font-mono text-sm"
                placeholder={
                  activeTab === "en"
                    ? "Write the rules and restrictions here..."
                    : "এখানে বিধি নিষেধ লিখুন..."
                }
              />
              <Button
                onClick={handleSave}
                disabled={isSaving || !content.en.trim() || !content.bn.trim()}
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
