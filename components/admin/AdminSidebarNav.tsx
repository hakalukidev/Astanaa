// components/admin/AdminSidebarNav.tsx
"use client";

import { FileText, FolderTree, Image, LayoutDashboard, PackagePlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/admin/products",
    label: "All Products",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/blog",
    label: "Blog Posts",
    icon: FileText,
  },
  {
    href: "/admin/slides",
    label: "Slides",
    icon: Image,
  },
  {
    href: "/admin/categories",
    label: "Categories & Sub Categories",
    icon: FolderTree,
  },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();
  const currentPathname = pathname ?? "";

  return (
    <nav className="space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          currentPathname === item.href ||
          (item.href !== "/admin/products" &&
            currentPathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
              isActive
                ? "bg-blue-500/20 text-white ring-1 ring-blue-500/40"
                : "text-blue-300 hover:bg-blue-900 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}