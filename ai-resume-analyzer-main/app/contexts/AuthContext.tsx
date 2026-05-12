import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Loads Firebase only on the client so SSR / dev module-runner does not transform the full auth SDK graph for root. */
let firebaseAuthPromise: Promise<{
  onAuthStateChanged: typeof import("firebase/auth").onAuthStateChanged;
  signInWithEmailAndPassword: typeof import("firebase/auth").signInWithEmailAndPassword;
  createUserWithEmailAndPassword: typeof import("firebase/auth").createUserWithEmailAndPassword;
  signOut: typeof import("firebase/auth").signOut;
  getClientAuth: typeof import("~/lib/firebase.client").getClientAuth;
}> | null = null;

function loadFirebaseAuth() {
  firebaseAuthPromise ??= (async () => {
    const [{ onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut }, { getClientAuth }] =
      await Promise.all([import("firebase/auth"), import("~/lib/firebase.client")]);
    return {
      onAuthStateChanged,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      getClientAuth,
    };
  })();
  return firebaseAuthPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    void (async () => {
      try {
        const fb = await loadFirebaseAuth();
        if (cancelled) return;
        const auth = fb.getClientAuth();
        unsub = fb.onAuthStateChanged(auth, (u) => {
          setUser(u);
          setLoading(false);
        });
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const fb = await loadFirebaseAuth();
    await fb.signInWithEmailAndPassword(fb.getClientAuth(), email.trim(), password);
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string) => {
    const fb = await loadFirebaseAuth();
    await fb.createUserWithEmailAndPassword(fb.getClientAuth(), email.trim(), password);
  }, []);

  const signOutUser = useCallback(async () => {
    const fb = await loadFirebaseAuth();
    await fb.signOut(fb.getClientAuth());
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInEmail,
      signUpEmail,
      signOutUser,
      getIdToken,
    }),
    [user, loading, signInEmail, signUpEmail, signOutUser, getIdToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
