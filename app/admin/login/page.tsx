import { redirect } from "next/navigation";

import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  if (isAdminAuthenticated()) {
    redirect("/admin/products");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.15),_transparent_40%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.2fr_minmax(360px,420px)]">
        <section className="space-y-6">
          <span className="inline-flex rounded-full border border-slate-300 bg-white/80 px-4 py-1 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
            Muaz Technology Admin
          </span>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Manage your full product catalog from one clean admin workspace.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Sign in to add products, update details, refresh pricing, and
              keep the catalog current.
            </p>
          </div>
        </section>

        <AdminLoginForm />
      </div>
    </main>
  );
}
