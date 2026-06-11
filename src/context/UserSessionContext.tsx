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

import type { GuestPersona } from "@/lib/guest-personas";

import { loadCameoComplete, loadTourComplete, saveCameoComplete, saveTourComplete, clearOnboardingProgress } from "@/data/guided-tour";



const STORAGE_KEY = "ber-war-map-session-v1";



export type UserRole = "guest" | "member";



export type UserSession =

  | { role: "guest"; persona?: GuestPersona }

  | { role: "member"; memberId: string };



type UserSessionContextValue = {

  session: UserSession | null;

  sessionReady: boolean;

  showPicker: boolean;

  boardRoomUnlocked: boolean;

  showGuidedTour: boolean;

  loginAsGuest: (persona?: GuestPersona) => void;

  loginAsMember: (memberId: string) => void;

  completeCameo: () => void;

  completeGuidedTour: () => void;

  skipGuidedTour: () => void;

  replayGuidedTour: () => void;

  tourReplayKey: number;

  switchUser: () => void;

  logout: () => void;

  isMember: boolean;

  memberId: string | null;

  guestPersona: GuestPersona | null;

};



const UserSessionContext = createContext<UserSessionContextValue | null>(null);



function loadSession(): UserSession | null {

  if (typeof window === "undefined") return null;

  try {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as UserSession;

    if (parsed.role === "guest") return { role: "guest", persona: parsed.persona ?? "explore" };

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

  const [boardRoomUnlocked, setBoardRoomUnlocked] = useState(false);

  const [showGuidedTour, setShowGuidedTour] = useState(false);

  const [tourReplayKey, setTourReplayKey] = useState(0);

  const promptGuidedTourIfNeeded = useCallback(() => {
    if (loadTourComplete()) return;
    setTourReplayKey((k) => k + 1);
    setShowGuidedTour(true);
  }, []);



  useEffect(() => {

    if (urlMemberId && getMitgliedById(urlMemberId)) {

      const next = { role: "member" as const, memberId: urlMemberId };

      setSession(next);

      saveSession(next);

      setShowPicker(false);

      const cameoDone = loadCameoComplete();

      setBoardRoomUnlocked(cameoDone);

      setShowGuidedTour(false);

      if (cameoDone) promptGuidedTourIfNeeded();

    } else {

      const stored = loadSession();

      const cameoDone = loadCameoComplete();

      setSession(stored);

      setShowPicker(!stored);

      setBoardRoomUnlocked(Boolean(stored) && cameoDone);

      setShowGuidedTour(false);

      if (stored && cameoDone) promptGuidedTourIfNeeded();

    }

    setSessionReady(true);

  }, [urlMemberId, promptGuidedTourIfNeeded]);



  const loginAsGuest = useCallback((persona: GuestPersona = "explore") => {

    const next: UserSession = { role: "guest", persona };

    setSession(next);

    saveSession(next);

    setShowPicker(false);

    const cameoDone = loadCameoComplete();

    setBoardRoomUnlocked(cameoDone);

    setShowGuidedTour(false);

    if (cameoDone) promptGuidedTourIfNeeded();

  }, [promptGuidedTourIfNeeded]);



  const loginAsMember = useCallback((memberId: string) => {

    if (!getMitgliedById(memberId)) return;

    const next: UserSession = { role: "member", memberId };

    setSession(next);

    saveSession(next);

    setShowPicker(false);

    const cameoDone = loadCameoComplete();

    setBoardRoomUnlocked(cameoDone);

    setShowGuidedTour(false);

    if (cameoDone) promptGuidedTourIfNeeded();

  }, [promptGuidedTourIfNeeded]);



  const completeCameo = useCallback(() => {

    saveCameoComplete();

    setBoardRoomUnlocked(true);

    promptGuidedTourIfNeeded();

  }, [promptGuidedTourIfNeeded]);



  const finishTour = useCallback(() => {

    saveTourComplete();

    setShowGuidedTour(false);

  }, []);



  const completeGuidedTour = finishTour;

  const skipGuidedTour = finishTour;



  const replayGuidedTour = useCallback(() => {

    setTourReplayKey((k) => k + 1);

    setShowGuidedTour(true);

  }, []);



  const switchUser = useCallback(() => {

    setShowPicker(true);

  }, []);



  const logout = useCallback(() => {

    setSession(null);

    saveSession(null);

    clearOnboardingProgress();

    setShowPicker(true);

    setBoardRoomUnlocked(false);

    setShowGuidedTour(false);

  }, []);

  const value = useMemo(
    () => ({
      session,
      sessionReady,
      showPicker,
      boardRoomUnlocked,
      showGuidedTour,
      loginAsGuest,
      loginAsMember,
      completeCameo,
      completeGuidedTour,
      skipGuidedTour,
      replayGuidedTour,
      tourReplayKey,
      switchUser,
      logout,
      isMember: session?.role === "member",
      memberId: session?.role === "member" ? session.memberId : null,
      guestPersona: session?.role === "guest" ? (session.persona ?? "explore") : null
    }),
    [
      session,
      sessionReady,
      showPicker,
      boardRoomUnlocked,
      showGuidedTour,
      loginAsGuest,
      loginAsMember,
      completeCameo,
      completeGuidedTour,
      skipGuidedTour,
      replayGuidedTour,
      tourReplayKey,
      switchUser,
      logout
    ]
  );



  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;

}



export function useUserSession() {

  const ctx = useContext(UserSessionContext);

  if (!ctx) throw new Error("useUserSession must be used within UserSessionProvider");

  return ctx;

}

