"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAppRedirectUrl, getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function signInWithDiscord() {
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: getAppRedirectUrl() }
    });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    setBusy(false);
  }

  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const displayName = session?.user.user_metadata?.full_name
    || session?.user.user_metadata?.name
    || session?.user.user_metadata?.user_name
    || session?.user.email
    || "Игрок";

  return (
    <main className="auth-page">
      <a className="auth-back" href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`}>← На главную</a>
      <section className="auth-card">
        <a className="auth-brand" href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/`}><span>F</span> FREE STEAM <b>GAME</b></a>
        <div className="auth-eyebrow">ТВОЁ ИГРОВОЕ ПРОСТРАНСТВО</div>
        <h1>{session ? "С возвращением!" : "Войди в игру."}</h1>
        <p className="auth-description">Используй Discord, чтобы создать профиль Free Steam Game, находить друзей и собирать собственные игровые коллекции.</p>

        {!configured ? (
          <div className="auth-notice">
            <strong>Supabase ещё не настроен</strong>
            <span>Добавь URL проекта и публичный anon key в переменные окружения GitHub Pages. Секретный service_role key сюда добавлять нельзя.</span>
          </div>
        ) : session ? (
          <div className="auth-signed-in">
            <div className="auth-avatar">{String(displayName).slice(0, 1).toUpperCase()}</div>
            <div><strong>{displayName}</strong><span>Discord подключён</span></div>
            <button className="auth-secondary" onClick={signOut} disabled={busy}>{busy ? "Выходим…" : "Выйти"}</button>
          </div>
        ) : (
          <button className="auth-discord-button" onClick={signInWithDiscord} disabled={busy || !ready}>
            <span className="discord-mark">◉</span>{busy ? "Переходим в Discord…" : "Продолжить через Discord"}<span>↗</span>
          </button>
        )}

        {error ? <p className="auth-error" role="alert">{error}</p> : null}
        <div className="auth-footnote">Мы не запрашиваем пароль от Steam и не просим передавать данные аккаунта Steam.</div>
        <div className="auth-legal">Продолжая, ты используешь независимый сервис Free Steam Game. Проект не связан с Valve Corporation или Steam.</div>
      </section>
    </main>
  );
}
