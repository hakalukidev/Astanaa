"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AdminRole = "admin" | "super_admin" | "moderator" | "promoter";

type AdminUser = {
  uid: string;
  email: string;
  name: string | null;
  role: AdminRole;
  createdAt: string | null;
};

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  moderator: "Moderator",
  promoter: "Promoter",
};

const ROLE_BADGE_STYLES: Record<AdminRole, string> = {
  super_admin: "bg-amber-100 text-amber-800",
  admin: "bg-blue-100 text-blue-700",
  moderator: "bg-purple-100 text-purple-700",
  promoter: "bg-emerald-100 text-emerald-700",
};

const usersQueryKey = ["admin-users"];

async function fetchUsers(): Promise<AdminUser[]> {
  const response = await fetch("/api/admin/users");

  if (!response.ok) {
    throw new Error("Failed to load admin users");
  }

  const payload = (await response.json()) as { users: AdminUser[] };
  return payload.users;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

type AdminUsersPageProps = {
  currentUid: string;
};

export default function AdminUsersPage({ currentUid }: AdminUsersPageProps) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [formError, setFormError] = useState("");
  const [pendingUid, setPendingUid] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");

  const {
    data: users = [],
    isPending,
    error,
  } = useQuery({
    queryKey: usersQueryKey,
    queryFn: fetchUsers,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not create the admin user.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      setIsCreateOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("admin");
      setFormError("");
      toast({ title: "Admin user created", description: "They can now sign in to the admin panel." });
    },
    onError: (mutationError: Error) => {
      setFormError(mutationError.message);
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({
      uid,
      nextName,
      nextPassword,
    }: {
      uid: string;
      nextName: string;
      nextPassword: string;
    }) => {
      const body: { name: string; password?: string } = { name: nextName };
      if (nextPassword) {
        body.password = nextPassword;
      }

      const response = await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not update this admin user.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      setEditingUser(null);
      setEditPassword("");
      setEditError("");
      toast({ title: "Admin user updated" });
    },
    onError: (mutationError: Error) => {
      setEditError(mutationError.message);
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ uid, nextRole }: { uid: string; nextRole: AdminRole }) => {
      const response = await fetch(`/api/admin/users/${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not update the role.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      toast({ title: "Role updated" });
    },
    onError: (mutationError: Error) => {
      toast({ title: "Update failed", description: mutationError.message, variant: "destructive" });
    },
    onSettled: () => setPendingUid(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async (uid: string) => {
      const response = await fetch(`/api/admin/users/${uid}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not remove this admin user.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey });
      toast({ title: "Admin user removed" });
    },
    onError: (mutationError: Error) => {
      toast({ title: "Removal failed", description: mutationError.message, variant: "destructive" });
    },
    onSettled: () => setPendingUid(null),
  });

  function handleCreateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    createMutation.mutate();
  }

  function handleRoleChange(user: AdminUser, nextRole: AdminRole) {
    if (nextRole === user.role) {
      return;
    }

    setPendingUid(user.uid);
    roleMutation.mutate({ uid: user.uid, nextRole });
  }

  function handleDelete(user: AdminUser) {
    const confirmed = window.confirm(`Remove admin access for ${user.email}?`);

    if (!confirmed) {
      return;
    }

    setPendingUid(user.uid);
    deleteMutation.mutate(user.uid);
  }

  function openEditDialog(user: AdminUser) {
    setEditingUser(user);
    setEditName(user.name ?? "");
    setEditPassword("");
    setEditError("");
  }

  function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    if (editPassword && editPassword.length < 8) {
      setEditError("Password must be at least 8 characters.");
      return;
    }

    setEditError("");
    editMutation.mutate({ uid: editingUser.uid, nextName: editName, nextPassword: editPassword });
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 shadow-sm">
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-blue-950">Admin users</CardTitle>
            <CardDescription>
              Create, change roles, or remove access to this admin panel. Only super
              admins can manage other admin users. Admins &amp; super admins manage the
              catalog and moderate listings; moderators only moderate listings;
              promoters only post their own listings for approval.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add admin user
          </Button>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 px-6 py-12 text-center text-sm text-red-700">
              Could not load admin users. Please refresh the page.
            </div>
          ) : isPending ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-6 py-14 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading admin users...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isSelf = user.uid === currentUid;
                  const isRowPending = pendingUid === user.uid;

                  return (
                    <TableRow key={user.uid}>
                      <TableCell className="min-w-[160px]">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-blue-950">{user.name || "—"}</p>
                            {isSelf ? <p className="text-xs text-slate-500">You</p> : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[200px] text-sm text-blue-950">{user.email}</TableCell>

                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                            ROLE_BADGE_STYLES[user.role]
                          )}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {ROLE_LABELS[user.role]}
                        </span>
                      </TableCell>

                      <TableCell className="text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={user.role}
                            onChange={(event) =>
                              handleRoleChange(user, event.target.value as AdminRole)
                            }
                            disabled={isSelf || isRowPending}
                            className="h-9 rounded-md border border-blue-200 bg-white px-2 text-xs font-medium text-blue-700 disabled:opacity-50"
                            title={isSelf ? "You cannot change your own role" : "Change role"}
                          >
                            {(Object.keys(ROLE_LABELS) as AdminRole[]).map((roleOption) => (
                              <option key={roleOption} value={roleOption}>
                                {ROLE_LABELS[roleOption]}
                              </option>
                            ))}
                          </select>
                          {isRowPending && roleMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => openEditDialog(user)}
                            title="Edit name or reset password"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(user)}
                            disabled={isSelf || isRowPending}
                            title={isSelf ? "You cannot remove your own access" : undefined}
                          >
                            {isRowPending && deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-950">Add admin user</DialogTitle>
            <DialogDescription>
              They&apos;ll be able to sign in immediately with this email and password.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-admin-name">Name (optional)</Label>
              <Input
                id="new-admin-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-admin-email">Email</Label>
              <Input
                id="new-admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-admin-password">Temporary password</Label>
              <Input
                id="new-admin-password"
                type="text"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-admin-role">Role</Label>
              <select
                id="new-admin-role"
                value={role}
                onChange={(event) => setRole(event.target.value as AdminRole)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="admin">Admin — manages the catalog &amp; moderates listings</option>
                <option value="super_admin">Super admin — can also manage admin users</option>
                <option value="moderator">Moderator — approves/removes listings only</option>
                <option value="promoter">Promoter — posts listings for approval only</option>
              </select>
            </div>
            {formError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {createMutation.isPending ? "Creating..." : "Create admin user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
            setEditError("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-950">Edit admin user</DialogTitle>
            <DialogDescription>
              Update {editingUser?.email}&apos;s name, or set a new password for them.
              Leave the password blank to keep their current one.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-2">
              <Label htmlFor="edit-admin-name">Name</Label>
              <Input
                id="edit-admin-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-admin-password">New password</Label>
              <Input
                id="edit-admin-password"
                type="text"
                value={editPassword}
                onChange={(event) => setEditPassword(event.target.value)}
                placeholder="Leave blank to keep current password"
                minLength={8}
              />
            </div>
            {editError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={editMutation.isPending}
              >
                {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
