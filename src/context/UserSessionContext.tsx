"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { getMitgliedById } from "@/data/mitglieder";

const STORAGE_KEY = "ber-war-map-session-v1";

export type UserRole = "guest" | "member";

export type UserSession =
  | { role: "guest" }
  | { role: "member"; memberId: string };

type UserSessionContextValue = {
  session: UserSession | null;
  sessionReady: boolean;
  showPicker: boolean;
  loginAsGuest: () => void;
  loginAsMember: (memberId: string) => void;
  switchUser: () => void;
  logout: () => void;
  isMember: boolean;
  memberId: string | null;
};

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

function loadSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserSession;
    if (parsed.role === "guest") return { role: "guest" };
    if (parsed.role === "member" && parsed.memberId && getMitgliedById(parsed.memberId)) {
      return { role: "member", memberId: parsed.memberId };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveSession(session: UserSession | null) {
  if (typeof window === "undefined") return;
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

export function UserSessionProvider({
  children,
  urlMemberId
}: {
  children: ReactNode;
  urlMemberId?: string | null;
}) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (urlMemberId && getMitgliedById(urlMemberId)) {
      const next = { role: "member" as const, memberId: urlMemberId };
      setSession(next);
      saveSession(next);
      setShowPicker(false);
    } else {
      const stored = loadSession();
      setSession(stored);
      setShowPicker(!stored);
    }
    setSessionReady(true);
  }, [urlMemberId]);

  const loginAsGuest = useCallback(() => {
    const next: UserSession = { role: "guest" };
    setSession(next);
    saveSession(next);
    setShowPicker(false);
  }, []);

  const loginAsMember = useCallback((memberId: string) => {
    if (!getMitgliedById(memberId)) return;
    const next: UserSession = { role: "member", memberId };
    setSession(next);
    saveSession(next);
    setShowPicker(false);
  }, []);

  const switchUser = useCallback(() => {
    setShowPicker(true);
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    saveSession(null);
    setShowPicker(true);
  }, []);

  const value = useMemo(
    () => ({
      session,
      sessionReady,
      showPicker,
      loginAsGuest,
      loginAsMember,
      switchUser,
      logout,
      isMember: session?.role === "member",
      memberId: session?.role === "member" ? session.memberId : null
    }),
    [session, sessionReady, showPicker, loginAsGuest, loginAsMember, switchUser, logout]
  );

  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;
}

export function useUserSession() {
  const ctx = useContext(UserSessionContext);
  if (!ctx) throw new Error("useUserSession must be used within UserSessionProvider");
  return ctx;
}
