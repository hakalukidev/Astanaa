"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type ImageUploadButtonProps = {
  disabled?: boolean;
  label?: string;
  onUploaded: (asset: { url: string; publicId: string }) => void;
};

type ImageUploadResponse = {
  url?: string;
  publicId?: string;
  message?: string;
};

const ACCEPTED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];
// Some browser/OS combos (seen on Linux especially) fail to report a
// correct file.type for a perfectly valid .jpg — it comes back as "" or
// something generic, which would fail the MIME check below and reject a
// real JPG. Fall back to the extension so that edge case isn't rejected.
const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function isAcceptedImage(file: File) {
  if (ACCEPTED_FILE_TYPES.includes(file.type)) {
    return true;
  }

  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function ImageUploadButton({
  disabled,
  label = "Upload image",
  onUploaded,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(file: File) {
    if (!isAcceptedImage(file)) {
      toast({
        title: "Unsupported image",
        description: "Please choose a PNG, JPG, JPEG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | ImageUploadResponse
        | null;

      if (!response.ok || !payload?.url || !payload.publicId) {
        throw new Error(payload?.message ?? "Image upload failed.");
      }

      onUploaded({
        url: payload.url,
        publicId: payload.publicId,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "The image could not be uploaded right now.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void uploadFile(file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={[...ACCEPTED_FILE_TYPES, ...ACCEPTED_EXTENSIONS].join(",")}
        className="sr-only"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <ImagePlus />
        )}
        {isUploading ? "Uploading..." : label}
      </Button>
    </>
  );
}
