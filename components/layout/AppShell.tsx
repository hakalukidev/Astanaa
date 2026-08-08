"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import Footer from "@/components/layout/Footer";
import TopBar from "@/components/layout/TopBar";
import { Toaster } from "@/components/ui/toaster";
import { recordVisit } from "@/lib/visits";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAdminRoute = (pathname ?? "").startsWith("/admin");

  useEffect(() => {
    // Counts real site visits only — not admin panel usage, and only once
    // per browser per day (see lib/visits.ts).
    if (!isAdminRoute) {
      recordVisit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {!isAdminRoute && <TopBar />}
      {children}
      {!isAdminRoute && <Footer />}
      <Toaster />
    </>
  );
}
