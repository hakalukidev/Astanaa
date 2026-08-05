"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

type CloudinaryUploadButtonProps = {
  disabled?: boolean;
  label?: string;
  onUploaded: (asset: { url: string; publicId: string }) => void;
};

type CloudinaryUploadResponse = {
  public_id?: string;
  secure_url?: string;
  error?: {
    message?: string;
  };
};

const ACCEPTED_FILE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function CloudinaryUploadButton({
  disabled,
  label = "Upload image",
  onUploaded,
}: CloudinaryUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER?.trim();

  async function uploadFile(file: File) {
    if (!cloudName || !uploadPreset) {
      toast({
        title: "Upload not configured",
        description: "Cloudinary upload settings are missing.",
        variant: "destructive",
      });
      return;
    }

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
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
      formData.append("upload_preset", uploadPreset);

      if (folder) {
        formData.append("folder", folder);
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const payload = (await response.json().catch(() => null)) as
        | CloudinaryUploadResponse
        | null;

      if (!response.ok || !payload?.secure_url || !payload.public_id) {
        throw new Error(payload?.error?.message ?? "Cloudinary upload failed.");
      }

      onUploaded({
        url: payload.secure_url,
        publicId: payload.public_id,
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
        accept={ACCEPTED_FILE_TYPES.join(",")}
        className="sr-only"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || !cloudName || !uploadPreset || isUploading}
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
