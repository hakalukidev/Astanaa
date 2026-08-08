"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  DEFAULT_FOOTER_SETTINGS,
  getFooterSettings,
  updateFooterSettings,
  type FooterSettings,
} from "@/lib/footer-settings";

export default function AdminFooterPage() {
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getFooterSettings()
      .then(setSettings)
      .finally(() => setIsLoading(false));
  }, []);

  function updateField<Key extends keyof FooterSettings>(key: Key, value: FooterSettings[Key]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateFooterSettings(settings);
      toast({ title: "Footer updated" });
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
          <CardTitle className="text-blue-950">Footer</CardTitle>
          <CardDescription>
            Controls the About text, contact info, and social links shown in the site footer on
            every page. Leave a field blank to fall back to its default. Social icons only appear
            once a URL is filled in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading footer settings...
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-950">About text</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="aboutTextEn">English</Label>
                    <Textarea
                      id="aboutTextEn"
                      value={settings.aboutTextEn}
                      onChange={(event) => updateField("aboutTextEn", event.target.value)}
                      rows={4}
                      placeholder={DEFAULT_FOOTER_SETTINGS.aboutTextEn}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aboutTextBn">বাংলা</Label>
                    <Textarea
                      id="aboutTextBn"
                      value={settings.aboutTextBn}
                      onChange={(event) => updateField("aboutTextBn", event.target.value)}
                      rows={4}
                      placeholder={DEFAULT_FOOTER_SETTINGS.aboutTextBn}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-950">Contact info</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={settings.address}
                      onChange={(event) => updateField("address", event.target.value)}
                      placeholder={DEFAULT_FOOTER_SETTINGS.address}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(event) => updateField("phone", event.target.value)}
                      placeholder={DEFAULT_FOOTER_SETTINGS.phone}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder={DEFAULT_FOOTER_SETTINGS.email}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-blue-950">Social links</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook URL</Label>
                    <Input
                      id="facebookUrl"
                      value={settings.facebookUrl}
                      onChange={(event) => updateField("facebookUrl", event.target.value)}
                      placeholder="https://facebook.com/astanaa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram URL</Label>
                    <Input
                      id="instagramUrl"
                      value={settings.instagramUrl}
                      onChange={(event) => updateField("instagramUrl", event.target.value)}
                      placeholder="https://instagram.com/astanaa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">Twitter / X URL</Label>
                    <Input
                      id="twitterUrl"
                      value={settings.twitterUrl}
                      onChange={(event) => updateField("twitterUrl", event.target.value)}
                      placeholder="https://twitter.com/astanaa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube URL</Label>
                    <Input
                      id="youtubeUrl"
                      value={settings.youtubeUrl}
                      onChange={(event) => updateField("youtubeUrl", event.target.value)}
                      placeholder="https://youtube.com/@astanaa"
                    />
                  </div>
                </div>
              </section>

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
