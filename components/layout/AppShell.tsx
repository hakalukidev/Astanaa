"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import TopBar from "@/components/layout/TopBar";
import { Toaster } from "@/components/ui/toaster";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAdminRoute = (pathname ?? "").startsWith("/admin");

  return (
    <>
      {!isAdminRoute && (
        <>
          <TopBar />
          <Navbar />
        </>
      )}
      {children}
      {!isAdminRoute && <Footer />}
      <Toaster />
    </>
  );
}
