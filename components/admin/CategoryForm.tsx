"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  normalizeSubcategories,
  type Category,
  type CategoryInput,
} from "@/lib/categories";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Category name is required."),
  subcategories: z.string().trim(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const emptyCategoryFormValues: CategoryFormValues = {
  name: "",
  subcategories: "",
};

export function toCategoryFormValues(category: Category): CategoryFormValues {
  return {
    name: category.name,
    subcategories: category.subcategories.join("\n"),
  };
}

function splitSubcategoryInput(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function toCategoryInput(values: CategoryFormValues): CategoryInput {
  return {
    name: values.name.trim(),
    subcategories: normalizeSubcategories(splitSubcategoryInput(values.subcategories)),
  };
}

type CategoryFormProps = {
  defaultValues?: CategoryFormValues;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  pendingLabel: string;
  submitLabel: string;
};

export default function CategoryForm({
  defaultValues = emptyCategoryFormValues,
  onSubmit,
  pendingLabel,
  submitLabel,
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: CategoryFormValues) {
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-700">Category name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Lifting Equipments"
                  {...field}
                  className="focus-visible:ring-blue-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subcategories"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-700">Subcategories</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={"2 Post Lift\n4 Post Lift\nScissor Lift"}
                  className="min-h-[160px] focus-visible:ring-blue-500"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add one subcategory per line. Comma-separated values also work.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {pendingLabel}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
