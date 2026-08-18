// components/admin/AdminSidebarNav.tsx
"use client";

import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileText,
  Image,
  Layers,
  LayoutPanelTop,
  MapPin,
  Megaphone,
  ShieldCheck,
  Tags,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { type AdminRole } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

const catalogItems = [
  {
    href: "/admin/posts",
    label: "All Posts",
    icon: Megaphone,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
  },
  {
    href: "/admin/promoters",
    label: "Promoters",
    icon: UserRound,
  },
  {
    href: "/admin/moderators",
    label: "Moderators",
    icon: UserCog,
  },
  {
    href: "/admin/site-users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/slides",
    label: "Slides",
    icon: Image,
  },
  {
    href: "/admin/locations",
    label: "Locations",
    icon: MapPin,
  },
  {
    href: "/admin/purposes",
    label: "Listing Purposes",
    icon: Layers,
  },
  {
    href: "/admin/property-types",
    label: "Property Type Categories",
    icon: Tags,
  },
  {
    href: "/admin/about",
    label: "About Us Page",
    icon: BookOpen,
  },
  {
    href: "/admin/terms",
    label: "Terms & Conditions",
    icon: FileText,
  },
  {
    href: "/admin/footer",
    label: "Footer",
    icon: LayoutPanelTop,
  },
];

const moderationItem = {
  href: "/admin/moderation",
  label: "Moderation Queue",
  icon: ClipboardCheck,
};

const myPostsItem = {
  href: "/admin/my-posts",
  label: "My Posts",
  icon: Megaphone,
};

const usersItem = { href: "/admin/users", label: "Admin Users", icon: ShieldCheck };

type AdminSidebarNavProps = {
  role: AdminRole;
};

export default function AdminSidebarNav({ role }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const currentPathname = pathname ?? "";

  let items: typeof catalogItems;

  if (role === "promoter") {
    items = [myPostsItem];
  } else if (role === "moderator") {
    items = [moderationItem];
  } else {
    // admin & super_admin
    items = [...catalogItems, moderationItem];
    if (role === "super_admin") {
      items = [...items, usersItem];
    }
  }

  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          currentPathname === item.href ||
          (item.href !== "/admin/posts" &&
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
