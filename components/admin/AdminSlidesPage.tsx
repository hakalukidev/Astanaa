"use client";

import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import CloudinaryUploadButton from "@/components/admin/CloudinaryUploadButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { fallbackSlides } from "@/lib/home-data";
import { deleteManagedSlideImage } from "@/lib/slide-image-service";
import { createSlide, deleteSlide, getAllSlides, updateSlide } from "@/lib/slide-service";
import { sortSlides, type Slide, type SlideInput } from "@/lib/slides";

type SlideRow = Slide;

type SlideFormValues = {
  title: string;
  image: string;
  imagePublicId: string;
  order: string;
  isActive: boolean;
};

function createEmptyFormValues(nextOrder: number): SlideFormValues {
  return {
    title: "",
    image: "",
    imagePublicId: "",
    order: String(nextOrder),
    isActive: true,
  };
}

export default function AdminSlidesPage() {
  const [slides, setSlides] = useState<SlideRow[]>(() => sortSlides(fallbackSlides));
  const [editingSlide, setEditingSlide] = useState<SlideRow | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingSlides, setIsLoadingSlides] = useState(true);
  const [isSavingSlide, setIsSavingSlide] = useState(false);
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SlideFormValues>(() => createEmptyFormValues(1));

  const nextSlideOrder = useMemo(
    () => slides.reduce((maxOrder, slide) => Math.max(maxOrder, slide.order), 0) + 1,
    [slides]
  );

  useEffect(() => {
    async function loadSlides() {
      try {
        const nextSlides = await getAllSlides();

        if (nextSlides.length > 0) {
          setSlides(nextSlides);
        } else {
          setSlides(sortSlides(fallbackSlides));
        }
      } catch {
        toast({
          title: "Could not load slides",
          description: "Showing fallback slides for now.",
          variant: "destructive",
        });
        setSlides(sortSlides(fallbackSlides));
      } finally {
        setIsLoadingSlides(false);
      }
    }

    void loadSlides();
  }, []);

  function openCreateDialog() {
    setEditingSlide(null);
    setFormValues(createEmptyFormValues(nextSlideOrder));
    setIsFormOpen(true);
  }

  function openEditDialog(slide: SlideRow) {
    setEditingSlide(slide);
    setFormValues({
      title: slide.title,
      image: slide.image,
      imagePublicId: slide.imagePublicId,
      order: String(slide.order),
      isActive: slide.isActive,
    });
    setIsFormOpen(true);
  }

  async function handleDeleteSlide(id: string) {
    const slide = slides.find((currentSlide) => currentSlide.id === id);

    if (!slide) {
      return;
    }

    const confirmed = window.confirm(`Delete "${slide.title}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingSlideId(id);

    try {
      await deleteSlide(id);
      setSlides((currentSlides) => currentSlides.filter((currentSlide) => currentSlide.id !== id));

      try {
        await deleteManagedSlideImage(slide);
      } catch {
        // Keep the delete success path even if image cleanup fails.
      }

      toast({
        title: "Slide deleted",
        description: "The slide was removed successfully.",
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "The slide could not be removed right now.",
        variant: "destructive",
      });
    } finally {
      setDeletingSlideId(null);
    }
  }

  async function handleSaveSlide(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = formValues.title.trim();
    const trimmedImage = formValues.image.trim();
    const trimmedImagePublicId = formValues.imagePublicId.trim();
    const parsedOrder = Number.parseInt(formValues.order, 10);

    if (!trimmedTitle || !trimmedImage || Number.isNaN(parsedOrder) || parsedOrder < 1) {
      toast({
        title: "Missing slide details",
        description: "Please add a title, upload an image, and enter a valid order.",
        variant: "destructive",
      });
      return;
    }

    const nextSlideInput: SlideInput = {
      title: trimmedTitle,
      image: trimmedImage,
      imagePublicId: trimmedImagePublicId,
      order: parsedOrder,
      isActive: formValues.isActive,
      tag: editingSlide?.tag ?? "Featured",
      cta: editingSlide?.cta ?? "VIEW PRODUCTS",
      ctaHref: editingSlide?.ctaHref ?? "/products",
      bg: editingSlide?.bg ?? "bg-slate-100",
    };

    setIsSavingSlide(true);

    try {
      if (editingSlide) {
        const previousImagePublicId = editingSlide.imagePublicId.trim();
        const imageChanged =
          editingSlide.image.trim() !== trimmedImage ||
          previousImagePublicId !== trimmedImagePublicId;

        await updateSlide(editingSlide.id, nextSlideInput);

        const nextSlide: SlideRow = {
          ...editingSlide,
          ...nextSlideInput,
          updatedAtMs: Date.now(),
        };

        setSlides((currentSlides) =>
          sortSlides(
            currentSlides.map((slide) => (slide.id === editingSlide.id ? nextSlide : slide))
          )
        );

        if (imageChanged && previousImagePublicId) {
          try {
            await deleteManagedSlideImage({
              imagePublicId: previousImagePublicId,
            });
          } catch {
            // The slide save should still succeed even if the old asset cleanup fails.
          }
        }
      } else {
        const createdSlide = await createSlide(nextSlideInput);
        const nextSlide: SlideRow = {
          id: createdSlide.id,
          ...nextSlideInput,
          createdAtMs: Date.now(),
          updatedAtMs: Date.now(),
        };

        setSlides((currentSlides) => sortSlides([...currentSlides, nextSlide]));
      }

      setIsFormOpen(false);
      setEditingSlide(null);
      setFormValues(createEmptyFormValues(nextSlideOrder));
      toast({
        title: editingSlide ? "Slide updated" : "Slide created",
        description: "The slide was saved successfully.",
      });
    } catch {
      toast({
        title: "Save failed",
        description: "The slide could not be saved right now.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSlide(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-950">Slides</h1>
          <p className="text-blue-600">Manage homepage slider images</p>
        </div>
        <Button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Slide
        </Button>
      </div>

      <Card className="border-blue-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-blue-950">Slides Data Table</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSlides ? (
            <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading slides...
            </div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Order</TableHead>
                <TableHead className="w-36">Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.map((slide) => (
                <TableRow key={slide.id}>
                  <TableCell className="font-medium">{slide.order}</TableCell>
                  <TableCell>
                    <div className="relative h-14 w-28 overflow-hidden rounded-md border border-blue-100 bg-blue-50">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-blue-950">{slide.title}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        slide.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {slide.isActive ? "Active" : "Hidden"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(slide)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-50"
                        disabled={deletingSlideId === slide.id}
                        onClick={() => handleDeleteSlide(slide.id)}
                      >
                        {deletingSlideId === slide.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingSlide ? "Edit Slide" : "Add Slide"}</DialogTitle>
            <DialogDescription>
              Update the slide title, image, order, and visibility.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSaveSlide}>
            <div className="space-y-2">
              <Label htmlFor="slide-title">Title</Label>
              <Input
                id="slide-title"
                value={formValues.title}
                onChange={(event) =>
                  setFormValues((currentValues) => ({
                    ...currentValues,
                    title: event.target.value,
                  }))
                }
                placeholder="Enter slide title"
              />
            </div>

            <div className="space-y-2">
              <Label>Slide image</Label>
              <div className="flex flex-wrap items-center gap-3">
                <CloudinaryUploadButton
                  label={formValues.image ? "Replace image" : "Upload image"}
                  disabled={isSavingSlide}
                  onUploaded={({ url, publicId }) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      image: url,
                      imagePublicId: publicId,
                    }))
                  }
                />
                {formValues.image ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setFormValues((currentValues) => ({
                        ...currentValues,
                        image: "",
                        imagePublicId: "",
                      }))
                    }
                  >
                    Remove image
                  </Button>
                ) : null}
              </div>
             <p className="text-sm text-slate-500">
  Upload a landscape slide image. Recommended size: 1440×900px or 1600×1000px (minimum 1200×800px). 
  Keep aspect ratio between 16:11 and 5:3. The image will be automatically cropped to fit the slider.
</p>
              {formValues.image ? (
                <div className="relative h-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <Image
                    src={formValues.image}
                    alt={formValues.title || "Slide preview"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slide-order">Order</Label>
                <Input
                  id="slide-order"
                  type="number"
                  min={1}
                  value={formValues.order}
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      order: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slide-status">Status</Label>
                <select
                  id="slide-status"
                  value={formValues.isActive ? "active" : "hidden"}
                  onChange={(event) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      isActive: event.target.value === "active",
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSavingSlide}>
                {isSavingSlide ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingSlide ? "Save Changes" : "Create Slide"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
