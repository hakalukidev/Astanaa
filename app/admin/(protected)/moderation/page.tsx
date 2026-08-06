import ModerationQueue from "@/components/admin/ModerationQueue";
import { requireModerator } from "@/lib/admin-auth";

export default async function AdminModerationRoute() {
  await requireModerator();

  return <ModerationQueue />;
}
