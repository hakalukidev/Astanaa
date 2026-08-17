import ModerationQueue from "@/components/admin/ModerationQueue";
import { requireModerator } from "@/lib/admin-auth";

export default async function AdminModerationRoute() {
  const admin = await requireModerator();

  return <ModerationQueue role={admin.role} adminUid={admin.uid} adminName={admin.email} />;
}
