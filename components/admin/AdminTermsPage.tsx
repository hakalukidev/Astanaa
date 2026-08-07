"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getTermsAndConditions, updateTermsAndConditions } from "@/lib/terms";

export default function AdminTermsPage() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getTermsAndConditions()
      .then(setContent)
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateTermsAndConditions(content);
      toast({ title: "Terms & Conditions updated" });
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
          <CardTitle className="text-blue-950">Terms & Conditions</CardTitle>
          <CardDescription>
            Shown to every user at signup — they must agree to this text before
            they can create an account. Editing here updates it live for everyone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading current terms...
            </div>
          ) : (
            <>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Write the terms and conditions here..."
              />
              <Button
                onClick={handleSave}
                disabled={isSaving || !content.trim()}
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
