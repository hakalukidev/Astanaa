"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AuthError } from "@/lib/auth/errors";

export type AppUser = {
  uid: string;
  email: string;
};

export type UserProfile = {
  uid: string;
  name: string;
  phone: string;
  email: string;
};

export type AuthAdminRole = "super_admin" | "admin" | "moderator" | "promoter" | null;

type MeResponse = {
  user: { uid: string; name: string | null; phone: string | null; email: string } | null;
  adminRole: AuthAdminRole;
};

type AuthContextValue = {
  user: AppUser | null;
  profile: UserProfile | null;
  /** Non-null if this signed-in user also has an /admin/login role (e.g. a promoter posting via the public site). */
  adminRole: AuthAdminRole;
  loading: boolean;
  signUp: (input: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  updateUserProfile: (input: { name: string; phone: string; email: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applyMeResponse(
  data: MeResponse,
  setUser: (user: AppUser | null) => void,
  setProfile: (profile: UserProfile | null) => void,
  setAdminRole: (role: AuthAdminRole) => void
) {
  if (data.user) {
    setUser({ uid: data.user.uid, email: data.user.email });
    setProfile({
      uid: data.user.uid,
      name: data.user.name ?? "",
      phone: data.user.phone ?? "",
      email: data.user.email,
    });
    setAdminRole(data.adminRole);
  } else {
    setUser(null);
    setProfile(null);
    setAdminRole(null);
  }
}

async function parseJsonSafely(response: Response) {
  return (await response.json().catch(() => null)) as Record<string, unknown> | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminRole, setAdminRole] = useState<AuthAdminRole>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = (await response.json()) as MeResponse;
      applyMeResponse(data, setUser, setProfile, setAdminRole);
    } catch {
      setUser(null);
      setProfile(null);
      setAdminRole(null);
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      adminRole,
      loading,
      async signUp({ name, phone, email, password }) {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, password }),
        });

        if (!response.ok) {
          const data = await parseJsonSafely(response);
          throw new AuthError((data?.code as string) ?? "auth/internal-error");
        }

        const data = (await response.json()) as { user: { uid: string; name: string; phone: string; email: string } };
        setUser({ uid: data.user.uid, email: data.user.email });
        setProfile(data.user);
      },
      async signIn(email, password) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const data = await parseJsonSafely(response);
          throw new AuthError((data?.code as string) ?? "auth/invalid-credential");
        }

        await refreshSession();
      },
      async logOut() {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        setUser(null);
        setProfile(null);
        setAdminRole(null);
      },
      async updateUserProfile({ name, phone, email }) {
        const response = await fetch("/api/auth/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email }),
        });

        if (!response.ok) {
          const data = await parseJsonSafely(response);
          throw new AuthError((data?.code as string) ?? "auth/internal-error");
        }

        setProfile({ uid: user?.uid ?? "", name, phone, email });
        setUser((current) => (current ? { ...current, email } : current));
      },
    }),
    [user, profile, adminRole, loading, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
