import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ProductPhotoProps = {
  alt: string;
  className?: string;
  imgClassName?: string;
  src?: string;
};

export default function ProductPhoto({
  alt,
  className,
  imgClassName,
  src,
}: ProductPhotoProps) {
  return (
    <div className={cn("overflow-hidden bg-slate-100", className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <div className="flex h-full min-h-[180px] w-full items-center justify-center text-slate-400">
          <div className="flex flex-col items-center gap-2 text-sm">
            <ImageIcon className="h-8 w-8" />
            <span>No photo</span>
          </div>
        </div>
      )}
    </div>
  );
}
