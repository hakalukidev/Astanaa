"use client";

const POLL_INTERVAL_MS = 8000;

export type NotificationType = "listing_approved" | "listing_rejected";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  listingId: string;
  listingTitle: string;
  read: boolean;
  createdAtMs: number | null;
};

/**
 * Polls the signed-in user's own notifications, newest first — replaces the
 * old live Firestore onSnapshot listener. `userId` is kept for call-site
 * compatibility but the server always scopes to the session's own user.
 */
export function subscribeToUserNotifications(
  _userId: string,
  callback: (notifications: AppNotification[]) => void
) {
  let cancelled = false;

  async function tick() {
    try {
      const response = await fetch("/api/notifications");
      const data = (await response.json()) as { notifications: AppNotification[] };
      if (!cancelled) callback(data.notifications);
    } catch {
      // Transient poll failure — keep showing whatever we had, try again.
    }
  }

  tick();
  const interval = setInterval(tick, POLL_INTERVAL_MS);

  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}

export async function markNotificationRead(id: string) {
  await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
}

/** `ids` kept for call-site compatibility — the server always marks every
 * currently-unread notification for the session user, not a client list. */
export async function markAllNotificationsRead(_ids: string[]) {
  await fetch("/api/notifications/read-all", { method: "POST" });
}
