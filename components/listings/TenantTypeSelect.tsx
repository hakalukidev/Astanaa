"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import TenantAvatar from "@/components/listings/TenantAvatar";
import { MAX_TENANT_TYPES, TENANT_TYPES, type TenantType } from "@/lib/tenant-types";

type TenantTypeSelectProps = {
  id?: string;
  value: TenantType[];
  onChange: (value: TenantType[]) => void;
  labels: Record<TenantType, string>;
  placeholder: string;
  limitHint: string;
};

/** Dropdown with avatars that lets the seller pick up to MAX_TENANT_TYPES tenant types. */
export default function TenantTypeSelect({
  id,
  value,
  onChange,
  labels,
  placeholder,
  limitHint,
}: TenantTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isAtLimit = value.length >= MAX_TENANT_TYPES;

  function toggle(type: TenantType) {
    if (value.includes(type)) {
      onChange(value.filter((selected) => selected !== type));
    } else if (!isAtLimit) {
      onChange([...value, type]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {value.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <span className="flex min-w-0 items-center gap-3">
            {value.map((type) => (
              <span key={type} className="flex items-center gap-1.5">
                <TenantAvatar type={type} className="h-6 w-6" />
                {labels[type]}
              </span>
            ))}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <ul role="listbox" aria-multiselectable="true">
            {TENANT_TYPES.map((type) => {
              const isSelected = value.includes(type);
              const isDisabled = !isSelected && isAtLimit;

              return (
                <li key={type} role="option" aria-selected={isSelected} aria-disabled={isDisabled}>
                  <button
                    type="button"
                    onClick={() => toggle(type)}
                    disabled={isDisabled}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                      isSelected ? "bg-green-50 font-medium text-green-800" : "text-gray-700 hover:bg-gray-50"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <TenantAvatar type={type} className="h-9 w-9" />
                    <span className="flex-1">{labels[type]}</span>
                    {isSelected ? <Check className="h-4 w-4 text-green-600" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-gray-100 px-3 pt-2 pb-1 text-xs text-gray-500">{limitHint}</p>
        </div>
      ) : null}
    </div>
  );
}
