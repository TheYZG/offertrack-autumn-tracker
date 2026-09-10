'use client';

import { useEffect, useState } from 'react';
import { CircleDot } from 'lucide-react';
import { AuthPanel, type AccountUser } from './auth-panel';
import { OfferTrackWorkspace } from './workspace';

export function OfferTrackApp() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/session', { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as {
          user?: AccountUser | null;
        };
        setUser(response.ok ? (payload.user ?? null) : null);
      })
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
    return () => controller.abort();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef6fb]">
        <div className="flex items-center gap-3 font-bold text-slate-600">
          <CircleDot className="size-5 animate-pulse text-emerald-600" />
          正在检查登录状态…
        </div>
      </main>
    );
  }

  if (!user) return <AuthPanel onAuthenticated={setUser} />;

  return (
    <OfferTrackWorkspace
      key={user.id}
      username={user.username}
      onLogout={() => void logout()}
    />
  );
}
