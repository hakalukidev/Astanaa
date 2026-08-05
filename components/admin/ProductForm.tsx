"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import CloudinaryUploadButton from "@/components/admin/CloudinaryUploadButton";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteManagedProductImages } from "@/lib/product-image-service";
import {
  extractCloudinaryPublicId,
} from "@/lib/product-images";
import {
  getCategoryKey,
  type ManagedCategoryOption,
} from "@/lib/categories";
import {
  getProductPhotoPublicIds,
  getProductPhotoUrls,
  type Product,
  type ProductInput,
} from "@/lib/products";
import { cn } from "@/lib/utils";

function parseImageUrls(value: string) {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

const productImageUrlsSchema = z
  .string()
  .trim()
  .min(1, "Upload at least one image or paste a valid image URL.")
  .superRefine((value, context) => {
    const imageUrls = parseImageUrls(value);

    if (imageUrls.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Upload at least one image or paste a valid image URL.",
      });
      return;
    }

    imageUrls.forEach((imageUrl, index) => {
      if (!z.string().url().safeParse(imageUrl).success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Image URL ${index + 1} is not a valid URL.`,
        });
      }
    });
  });

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Product name is required."),
  category: z.string().trim().min(1, "Category is required."),
  price: z.string().trim().min(1, "Price is required."),
  description: z.string().trim().min(8, "Short description is required."),
  details: z.string().trim().min(12, "Details are required."),
  keyHighlights: z.string().trim(),
  photoUrlsText: productImageUrlsSchema,
  photoPublicIds: z.array(z.string().trim()),
  isHot: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const emptyProductFormValues: ProductFormValues = {
  name: "",
  category: "",
  price: "Contact for Price",
  description: "",
  details: "",
  keyHighlights: "",
  photoUrlsText: "",
  photoPublicIds: [],
  isHot: false,
};

export function toProductFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    category: product.category || "",
    price: product.price,
    description: product.description,
    details: product.details,
    keyHighlights: product.keyHighlights.join("\n"),
    photoUrlsText: getProductPhotoUrls(product).join("\n"),
    photoPublicIds: getProductPhotoPublicIds(product),
    isHot: product.isHot,
  };
}

export function toProductInput(values: ProductFormValues): ProductInput {
  const photoUrls = parseImageUrls(values.photoUrlsText);
  const photoPublicIds = Array.from(
    new Set(
      values.photoPublicIds
        .map((entry) => entry.trim())
        .filter(Boolean)
        .concat(
          photoUrls
            .map((photoUrl) => extractCloudinaryPublicId(photoUrl) ?? "")
            .filter(Boolean)
        )
    )
  );

  return {
    name: values.name.trim(),
    category: values.category.trim(),
    price: values.price.trim(),
    description: values.description.trim(),
    details: values.details.trim(),
    keyHighlights: values.keyHighlights
      .split("\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0),
    photoUrl: photoUrls[0] ?? "",
    photoPublicId: photoPublicIds[0] ?? "",
    photoUrls,
    photoPublicIds,
    isHot: values.isHot,
  };
}

type ProductFormProps = {
  categoriesLoading?: boolean;
  categoryOptions?: ManagedCategoryOption[];
  defaultValues?: ProductFormValues;
  layout?: "page" | "dialog";
  onSubmit: (values: ProductFormValues) => Promise<void>;
  pendingLabel: string;
  resetOnSuccess?: boolean;
  submitLabel: string;
};

export default function ProductForm({
  categoriesLoading = false,
  categoryOptions = [],
  defaultValues = emptyProductFormValues,
  layout = "page",
  onSubmit,
  pendingLabel,
  resetOnSuccess = false,
  submitLabel,
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");
  const previewName = form.watch("name");
  const selectedCategory = form.watch("category");
  const previewUrls = parseImageUrls(form.watch("photoUrlsText"));
  const uploadedImagesRef = useRef(
    new Map<string, { photoUrl: string; photoPublicId: string }>()
  );
  const skipUnmountCleanupRef = useRef(false);
  const hasExistingPhoto = previewUrls.length > 0;
  const uploadButtonLabel = hasExistingPhoto ? "Add image" : "Upload image";

  useEffect(() => {
    return () => {
      if (skipUnmountCleanupRef.current) {
        return;
      }

      const uploadedImages = Array.from(uploadedImagesRef.current.values());
      uploadedImagesRef.current.clear();

      uploadedImages.forEach((image) => {
        void deleteManagedProductImages(image).catch(() => undefined);
      });
    };
  }, []);

  useEffect(() => {
    if (previewUrls.length === 0) {
      setSelectedPreviewUrl("");
      return;
    }

    if (!selectedPreviewUrl || !previewUrls.includes(selectedPreviewUrl)) {
      setSelectedPreviewUrl(previewUrls[0]);
    }
  }, [previewUrls, selectedPreviewUrl]);

  useEffect(() => {
    if (form.getValues("category").trim() || categoryOptions.length === 0) {
      return;
    }

    form.setValue("category", categoryOptions[0].value, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [categoryOptions, form]);

  const resolvedCategoryOptions = (() => {
    const currentCategory = selectedCategory.trim();

    if (!currentCategory) {
      return categoryOptions;
    }

    const currentCategoryKey = getCategoryKey(currentCategory);

    if (
      categoryOptions.some((option) => getCategoryKey(option.value) === currentCategoryKey)
    ) {
      return categoryOptions;
    }

    return [
      {
        label: `${currentCategory} (current value)`,
        parentName: null,
        type: "main" as const,
        value: currentCategory,
      },
      ...categoryOptions,
    ];
  })();

  function rememberUploadedImage(image: { photoUrl: string; photoPublicId: string }) {
    if (!image.photoPublicId.trim()) {
      return;
    }

    uploadedImagesRef.current.set(image.photoPublicId.trim(), image);
  }

  function discardUploadedImage(publicId: string) {
    const trimmedPublicId = publicId.trim();

    if (!trimmedPublicId) {
      return;
    }

    const uploadedImage = uploadedImagesRef.current.get(trimmedPublicId);

    if (!uploadedImage) {
      return;
    }

    uploadedImagesRef.current.delete(trimmedPublicId);
    void deleteManagedProductImages(uploadedImage).catch(() => undefined);
  }

  function syncPhotoPublicIds(photoUrlsText: string, nextPublicIds: string[] = []) {
    const derivedPublicIds = parseImageUrls(photoUrlsText)
      .map((photoUrl) => extractCloudinaryPublicId(photoUrl) ?? "")
      .filter(Boolean);
    const uniquePublicIds = Array.from(
      new Set(
        nextPublicIds
          .map((publicId) => publicId.trim())
          .filter(Boolean)
          .concat(derivedPublicIds)
      )
    );

    form.setValue("photoPublicIds", uniquePublicIds, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    });
  }

  function cleanupUnsavedUploadedImages(savedPublicIds: string[]) {
    const savedPublicIdSet = new Set(savedPublicIds.map((publicId) => publicId.trim()).filter(Boolean));
    const uploadsToDelete = Array.from(uploadedImagesRef.current.entries()).filter(
      ([publicId]) => !savedPublicIdSet.has(publicId)
    );

    uploadsToDelete.forEach(([publicId, image]) => {
      uploadedImagesRef.current.delete(publicId);
      void deleteManagedProductImages(image).catch(() => undefined);
    });

    if (savedPublicIdSet.size === 0) {
      uploadedImagesRef.current.clear();
      return;
    }
  }

  function handleUploadedPhoto(url: string, publicId: string) {
    rememberUploadedImage({
      photoUrl: url,
      photoPublicId: publicId,
    });
    const currentUrls = parseImageUrls(form.getValues("photoUrlsText"));
    const nextUrls = currentUrls.includes(url) ? currentUrls : currentUrls.concat(url);
    const nextPhotoUrlsText = nextUrls.join("\n");

    form.setValue("photoUrlsText", nextPhotoUrlsText, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    syncPhotoPublicIds(nextPhotoUrlsText, form.getValues("photoPublicIds").concat(publicId));
    setSelectedPreviewUrl(url);
  }

  function handleRemovePhoto(urlToRemove: string) {
    const nextUrls = parseImageUrls(form.getValues("photoUrlsText")).filter(
      (photoUrl) => photoUrl !== urlToRemove
    );
    const nextPhotoUrlsText = nextUrls.join("\n");
    const removedPublicId = extractCloudinaryPublicId(urlToRemove) ?? "";
    const nextPublicIds = form
      .getValues("photoPublicIds")
      .filter((publicId) => publicId !== removedPublicId);

    form.setValue("photoUrlsText", nextPhotoUrlsText, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    syncPhotoPublicIds(nextPhotoUrlsText, nextPublicIds);

    if (removedPublicId && uploadedImagesRef.current.has(removedPublicId)) {
      discardUploadedImage(removedPublicId);
    }
  }

  async function handleSubmit(values: ProductFormValues) {
    setIsSubmitting(true);

    try {
      await onSubmit(values);

      cleanupUnsavedUploadedImages(values.photoPublicIds);

      if (resetOnSuccess) {
        uploadedImagesRef.current.clear();
      } else {
        for (const savedPublicId of values.photoPublicIds) {
          uploadedImagesRef.current.delete(savedPublicId.trim());
        }
        skipUnmountCleanupRef.current = true;
      }

      if (resetOnSuccess) {
        form.reset(defaultValues);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div
          className={cn(
            "grid gap-6",
            layout === "page"
              ? "xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]"
              : "xl:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]"
          )}
        >
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700">Product name</FormLabel>
                    <FormControl>
                      <Input placeholder="Autel MX808S" {...field} className="focus-visible:ring-blue-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-blue-700">Price</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact for Price" {...field} className="focus-visible:ring-blue-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">Category</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      disabled={categoriesLoading && resolvedCategoryOptions.length === 0}
                      {...field}
                    >
                      <option value="" disabled>
                        {categoriesLoading
                          ? "Loading categories..."
                          : resolvedCategoryOptions.length > 0
                            ? "Select a category"
                            : "Add a category first"}
                      </option>
                      {resolvedCategoryOptions.map((categoryOption) => (
                        <option
                          key={`${categoryOption.type}:${categoryOption.value}`}
                          value={categoryOption.value}
                        >
                          {categoryOption.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <p className="text-sm text-blue-500">
                    {resolvedCategoryOptions.length > 0
                      ? "Main categories and subcategories come from the Categories admin page."
                      : "Create a category group first, then return here to assign products."}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">Short description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Professional diagnostic scanner for all car models."
                      className="focus-visible:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add longer product details, specifications, and selling points."
                      className="min-h-[160px] focus-visible:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keyHighlights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">Key highlights (one per line)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="High-resolution product imagery\nProfessional workshop-ready presentation"
                      className="min-h-[120px] focus-visible:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photoUrlsText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-700">Product images</FormLabel>
                  <div className="flex flex-col gap-3">
                    <FormControl>
                      <Textarea
                        placeholder={"https://images.example.com/product-1.jpg\nhttps://images.example.com/product-2.jpg"}
                        className="focus-visible:ring-blue-500"
                        {...field}
                        onChange={(event) => {
                          const nextPhotoUrlsText = event.target.value;

                          field.onChange(nextPhotoUrlsText);
                          syncPhotoPublicIds(nextPhotoUrlsText, form.getValues("photoPublicIds"));
                        }}
                      />
                    </FormControl>
                    <CloudinaryUploadButton
                      disabled={isSubmitting}
                      label={uploadButtonLabel}
                      onUploaded={({ url, publicId }) => {
                        handleUploadedPhoto(url, publicId);
                      }}
                    />
                  </div>
                  <p className="text-sm text-blue-500">
                    {hasExistingPhoto
                      ? "The first image is used on product cards. Upload more images or paste one image URL per line."
                      : "Upload one or more images, or paste one image URL per line."}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isHot"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <label className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      Highlight this product in featured sections
                    </label>
                  </FormControl>
                </FormItem>
              )}
            />

            <Button className="w-full bg-blue-600 hover:bg-blue-700 md:w-auto" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
              {isSubmitting ? pendingLabel : submitLabel}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <p className="text-sm font-medium text-blue-950">Image preview</p>
                <p className="text-sm text-blue-500">
                  The first image is the card image. Click any thumbnail to preview it here.
                </p>
              </div>
              {selectedPreviewUrl ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50">
                    <img
                      src={selectedPreviewUrl}
                      alt={previewName || "Uploaded product preview"}
                      className="h-72 w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewUrls.map((photoUrl, index) => {
                      const isSelected = photoUrl === selectedPreviewUrl;

                      return (
                        <div key={`${photoUrl}-${index}`} className="relative">
                          <button
                            type="button"
                            onClick={() => setSelectedPreviewUrl(photoUrl)}
                            className={cn(
                              "overflow-hidden rounded-lg border bg-white",
                              isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-blue-200"
                            )}
                          >
                            <img
                              src={photoUrl}
                              alt={`${previewName || "Product"} thumbnail ${index + 1}`}
                              className="h-16 w-16 object-cover"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photoUrl)}
                            className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-red-600 shadow-sm transition hover:bg-red-50"
                            aria-label={`Remove image ${index + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-blue-300 bg-blue-50 text-blue-500">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <ImageIcon className="h-10 w-10" />
                    <p>Upload product images to preview them here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
