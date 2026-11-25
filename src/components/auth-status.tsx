"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function AuthStatus({ compact = false }: { compact?: boolean }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) { setSession(data.session); setReady(true); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
  }

  const user = session?.user;
  const metadata = user?.user_metadata ?? {};
  const name = metadata.full_name || metadata.name || metadata.user_name || user?.email || "Игрок";
  const avatar = metadata.avatar_url || metadata.picture;
  const initial = String(name).slice(0, 1).toUpperCase();

  if (compact) {
    if (!ready) return <span className="discord-soon">Проверяем вход…</span>;
    return user
      ? <span className="discord-soon">Вошли: {name}</span>
      : <a className="discord-soon" href={`${basePath}/login/`}>Войти через Discord ↗</a>;
  }

  return (
    <>
      <div className="profile-mini">
        {user && avatar
          ? <img className="avatar-placeholder auth-status-avatar" src={avatar} alt="" />
          : <div className="avatar-placeholder">{user ? initial : "G"}</div>}
        <div className="profile-mini-copy">
          <strong>{ready ? (user ? name : "Гость") : "Проверяем вход…"}</strong>
          <span>{user ? "Discord подключён" : <a href={`${basePath}/login/`}>Войти через Discord</a>}</span>
        </div>
        <span className="status-dot" />
      </div>
      {user ? <button className="auth-status-signout" onClick={signOut} disabled={busy}>{busy ? "Выходим…" : "Выйти"}</button> : null}
      {!user ? <p className="sidebar-note">Войди через Discord, чтобы открыть профиль и функции сообщества.</p> : null}
    </>
  );
}
