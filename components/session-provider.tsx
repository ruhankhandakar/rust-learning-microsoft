"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SessionData {
  user: SessionUser | null;
  isPending: boolean;
}

const SessionContext = createContext<SessionData>({
  user: null,
  isPending: true,
});

export function useSessionLite() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    fetch("/api/auth/get-session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data?.user ?? null);
        setIsPending(false);
      })
      .catch(() => setIsPending(false));
  }, []);

  return (
    <SessionContext.Provider value={{ user, isPending }}>
      {children}
    </SessionContext.Provider>
  );
}
