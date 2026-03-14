'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const MAX_PROBES   = 5;
const TRIAL_DAYS   = 14;
const DEV_PASSWORD = 'trap';          // unlimited, no expiry
const TRIAL_KEY    = 'TRP-LIVE-2026'; // 5 probes, 14-day window

interface DemoModeCtx {
  demoMode: boolean;
  probesRemaining: number | null; // null = unlimited (dev key)
  setDemoMode: (v: boolean) => void;
  unlockLive: (password: string) => boolean;
  consumeProbe: () => boolean; // returns false if blocked (reverts to demo)
}

const DemoModeContext = createContext<DemoModeCtx>({
  demoMode: true,
  probesRemaining: null,
  setDemoMode: () => {},
  unlockLive: () => false,
  consumeProbe: () => false,
});

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [demoMode, setDemoModeState] = useState(true);
  const [probesRemaining, setProbesRemaining] = useState<number | null>(null);

  useEffect(() => {
    const live = sessionStorage.getItem('trp_live');
    if (!live) return;

    // Dev key: unlimited
    if (live === 'dev') {
      setDemoModeState(false);
      setProbesRemaining(null);
      return;
    }

    // Trial key: check expiry + probe count
    const startStr = localStorage.getItem('trp_trial_start');
    const countStr = localStorage.getItem('trp_probes');
    const count    = countStr !== null ? parseInt(countStr, 10) : MAX_PROBES;
    const started  = startStr ? new Date(startStr) : null;
    const expired  = started
      ? (Date.now() - started.getTime()) > TRIAL_DAYS * 864e5
      : false;

    if (expired || count <= 0) {
      // Trial over — revert to demo
      sessionStorage.removeItem('trp_live');
      setDemoModeState(true);
      setProbesRemaining(0);
    } else {
      setDemoModeState(false);
      setProbesRemaining(count);
    }
  }, []);

  const setDemoMode = (v: boolean) => {
    if (v) {
      sessionStorage.removeItem('trp_live');
      setDemoModeState(true);
    }
    // Switching to live is only via unlockLive()
  };

  const unlockLive = (password: string): boolean => {
    if (password === DEV_PASSWORD) {
      sessionStorage.setItem('trp_live', 'dev');
      setDemoModeState(false);
      setProbesRemaining(null);
      return true;
    }
    if (password === TRIAL_KEY) {
      // Start trial clock if first time
      if (!localStorage.getItem('trp_trial_start')) {
        localStorage.setItem('trp_trial_start', new Date().toISOString());
      }
      const existing = localStorage.getItem('trp_probes');
      const count    = existing !== null ? parseInt(existing, 10) : MAX_PROBES;
      if (count <= 0) return false; // exhausted
      localStorage.setItem('trp_probes', String(count));
      sessionStorage.setItem('trp_live', 'trial');
      setDemoModeState(false);
      setProbesRemaining(count);
      return true;
    }
    return false;
  };

  const consumeProbe = (): boolean => {
    if (demoMode) return false;
    // Dev key = unlimited
    if (probesRemaining === null) return true;

    if (probesRemaining <= 0) {
      sessionStorage.removeItem('trp_live');
      setDemoModeState(true);
      setProbesRemaining(0);
      return false;
    }

    const next = probesRemaining - 1;
    localStorage.setItem('trp_probes', String(next));
    setProbesRemaining(next);

    if (next <= 0) {
      // Last probe just used — will revert after this search completes
      setTimeout(() => {
        sessionStorage.removeItem('trp_live');
        setDemoModeState(true);
      }, 3000); // give time for result to render
    }
    return true;
  };

  return (
    <DemoModeContext.Provider value={{ demoMode, probesRemaining, setDemoMode, unlockLive, consumeProbe }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
