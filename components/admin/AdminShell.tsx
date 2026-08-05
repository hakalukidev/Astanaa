import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-blue-950 text-blue-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-blue-800 bg-blue-950/95 px-6 py-8 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:border-b-0 lg:border-r">
          <div className="flex min-h-full flex-col gap-6">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-blue-700 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-blue-300">
                Admin Panel
              </span>
              <div>
                <h1 className="text-2xl font-semibold text-white">Muaz Admin</h1>
                <p className="mt-2 text-sm leading-6 text-blue-300">
                  Manage your product catalog, pricing, images, and featured
                  items from one place.
                </p>
              </div>
            </div>

            <AdminSidebarNav />

            <div className="mt-auto">
              <AdminLogoutButton />
            </div>
          </div>
        </aside>

        <main className="bg-blue-50 px-4 py-6 text-blue-900 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
