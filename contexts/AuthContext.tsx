"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { db, getFirebaseAuth } from "@/lib/firebase";

export const USERS_COLLECTION = "users";
export const ADMINS_COLLECTION = "admins";

export type UserProfile = {
  uid: string;
  name: string;
  phone: string;
  email: string;
};

export type AuthAdminRole = "super_admin" | "admin" | "moderator" | "promoter" | null;

type AuthContextValue = {
  user: User | null;
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
  /** Lets a signed-in user correct their own name/phone/email. Changing the
   * email calls Firebase Auth's updateEmail, which throws
   * "auth/requires-recent-login" if their session is old — callers should
   * catch that and ask the user to log out and back in first. */
  updateUserProfile: (input: { name: string; phone: string; email: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminRole, setAdminRole] = useState<AuthAdminRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (nextUser && db) {
        const [profileSnapshot, adminSnapshot] = await Promise.all([
          getDoc(doc(db, USERS_COLLECTION, nextUser.uid)),
          getDoc(doc(db, ADMINS_COLLECTION, nextUser.uid)).catch(() => null),
        ]);
        const profileData = profileSnapshot.data();
        const adminData = adminSnapshot?.data();

        setProfile({
          uid: nextUser.uid,
          name:
            (typeof profileData?.name === "string" && profileData.name) ||
            nextUser.displayName ||
            "",
          phone: (typeof profileData?.phone === "string" && profileData.phone) || "",
          email: nextUser.email ?? "",
        });
        setAdminRole((adminData?.role as AuthAdminRole) ?? null);
      } else {
        setProfile(null);
        setAdminRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      adminRole,
      loading,
      async signUp({ name, phone, email, password }) {
        const auth = getFirebaseAuth();

        if (!auth) {
          throw new Error("Sign-up is not available right now.");
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });

        if (db) {
          await setDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
            name,
            phone,
            email,
            createdAt: serverTimestamp(),
          });
        }

        setProfile({ uid: credential.user.uid, name, phone, email });
      },
      async signIn(email, password) {
        const auth = getFirebaseAuth();

        if (!auth) {
          throw new Error("Sign-in is not available right now.");
        }

        await signInWithEmailAndPassword(auth, email, password);
      },
      async logOut() {
        const auth = getFirebaseAuth();

        if (!auth) {
          return;
        }

        await signOut(auth);
      },
      async updateUserProfile({ name, phone, email }) {
        const auth = getFirebaseAuth();
        const currentUser = auth?.currentUser;

        if (!auth || !currentUser) {
          throw new Error("You need to be logged in to update your profile.");
        }

        if (name !== currentUser.displayName) {
          await updateProfile(currentUser, { displayName: name });
        }

        if (email !== currentUser.email) {
          // Throws "auth/requires-recent-login" on an old session — the
          // Firestore/local state below intentionally isn't touched in that
          // case, so the form still reflects the (unchanged) real email.
          await updateEmail(currentUser, email);
        }

        if (db) {
          await setDoc(
            doc(db, USERS_COLLECTION, currentUser.uid),
            { name, phone, email, updatedAt: serverTimestamp() },
            { merge: true }
          );
        }

        setProfile({ uid: currentUser.uid, name, phone, email });
      },
    }),
    [user, profile, adminRole, loading]
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
