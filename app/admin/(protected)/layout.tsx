import type { ReactNode } from "react";

import AdminShell from "@/components/admin/AdminShell";

type ProtectedAdminLayoutProps = {
  children: ReactNode;
};

export default function ProtectedAdminLayout({
  children,
}: ProtectedAdminLayoutProps) {
  return <AdminShell>{children}</AdminShell>;
}
