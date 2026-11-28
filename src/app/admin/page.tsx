"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { RoleBadge } from "@/components/role-badge";

type StaffUser = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "moderator" | "admin" | "owner";
  created_at: string;
};

export default function AdminPage() {
  const supabase = getSupabaseBrowserClient();
  const [role, setRole] = useState("");
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [xpAmount, setXpAmount] = useState("100");

  const load = useCallback(async () => {
    if (!supabase) { setMessage("Supabase не настроен."); setLoading(false); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setMessage("Войди в аккаунт FSG, чтобы открыть панель."); setLoading(false); return; }
    const { data: myRole, error: roleError } = await supabase.rpc("get_my_fsg_role");
    if (roleError) { setMessage("Не удалось проверить роль. Примени миграции 0004 и 0005 в Supabase."); setLoading(false); return; }
    setRole(String(myRole || "user"));
    if (!["owner", "admin", "moderator"].includes(String(myRole))) {
      setMessage("Доступ закрыт. Панель доступна только команде FSG."); setLoading(false); return;
    }
    const { data, error } = await supabase.rpc("get_fsg_admin_users");
    if (error) setMessage("Не удалось загрузить пользователей: " + error.message);
    else setUsers((data || []) as StaffUser[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void load(); }, [load]);

  async function changeRole(userId: string, nextRole: "user" | "moderator" | "admin") {
    if (!supabase || role !== "owner") return;
    setBusy(userId); setMessage("");
    const { error } = await supabase.rpc("set_fsg_user_role", { target_user_id: userId, new_role: nextRole });
    if (error) setMessage("Не удалось изменить роль: " + error.message);
    else { setMessage("Роль успешно обновлена."); await load(); }
    setBusy("");
  }

  async function grantExperience(userId: string, mode: "xp" | "level") {
    if (!supabase || role !== "owner") return;
    const amount = Number(xpAmount);
    if (mode === "xp" && (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000)) {
      setMessage("Укажи целое количество XP от 1 до 1 000 000 000.");
      return;
    }
    setBusy(userId); setMessage("");
    const { data, error } = await supabase.rpc("grant_fsg_user_xp", {
      target_user_id: userId,
      xp_amount: mode === "xp" ? amount : null,
      level_count: mode === "level" ? 1 : null
    });
    if (error) setMessage("Не удалось изменить опыт: " + error.message);
    else setMessage("Готово! Новый общий опыт пользователя: " + String(data) + " XP.");
    setBusy("");
  }

  const visibleUsers = users.filter((u) => [u.username, u.display_name || "", u.user_id].join(" ").toLowerCase().includes(search.toLowerCase()));
  const counts = users.reduce<Record<string, number>>((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  return (
    <main className="adm-page">
      <div className="adm-wrap">
        <Link href="/" className="adm-back">← Вернуться в FSG</Link>
        <header className="adm-head">
          <div>
            <div className="adm-kicker">FREE STEAM GAME · CONTROL CENTER</div>
            <h1>Панель управления</h1>
            <p>Пользователи, роли и контроль доступа</p>
          </div>
          <div className="adm-me">
            <span>ТВОЯ РОЛЬ</span>
            {role ? <RoleBadge role={role as StaffUser["role"]} /> : <strong>Проверка…</strong>}
          </div>
        </header>

        {message && <div role="status" className="adm-message">{message}</div>}

        {users.length > 0 && (
          <div className="adm-stats">
            <div><strong>{users.length}</strong><span>Профилей</span></div>
            <div><strong>{counts.owner || 0}</strong><span>Владельцев</span></div>
            <div><strong>{counts.admin || 0}</strong><span>Администраторов</span></div>
            <div><strong>{counts.moderator || 0}</strong><span>Модераторов</span></div>
          </div>
        )}

        <section className="adm-card">
          <div className="adm-card-head">
            <div><h2>Управление пользователями</h2><span>Показаны последние 200 зарегистрированных профилей</span></div>
            <div className="adm-tools">
              {role === "owner" && (
                <label>Сколько XP начислить
                  <input type="number" min="1" max="1000000000" step="1" value={xpAmount} onChange={(e) => setXpAmount(e.target.value)} />
                </label>
              )}
              <input className="adm-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по нику или ID" aria-label="Поиск пользователей" />
            </div>
          </div>

          {loading ? <p className="adm-muted">Загружаем данные…</p> : visibleUsers.length === 0 ? <p className="adm-muted">Пользователи не найдены.</p> : (
            <div className="adm-list">
              {visibleUsers.map((u) => (
                <div key={u.user_id} className="adm-row">
                  <div className="adm-user">
                    {u.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={u.avatar_url} alt="" />
                      : <div className="adm-avatar">{(u.display_name || u.username).slice(0, 1).toUpperCase()}</div>}
                    <div>
                      <strong>{u.display_name || u.username}</strong>
                      <span>@{u.username} · {u.user_id.slice(0, 8)}…</span>
                    </div>
                  </div>
                  <div className="adm-actions">
                    <RoleBadge role={u.role} />
                    {role === "owner" && (
                      <>
                        <button className="adm-btn adm-btn-primary" disabled={busy === u.user_id} onClick={() => void grantExperience(u.user_id, "xp")}>+{xpAmount || "0"} XP</button>
                        <button className="adm-btn" disabled={busy === u.user_id} onClick={() => void grantExperience(u.user_id, "level")}>+1 уровень</button>
                        {u.role !== "owner" && (
                          <select className="adm-select" aria-label={"Роль для " + u.username} disabled={busy === u.user_id} value={u.role} onChange={(e) => void changeRole(u.user_id, e.target.value as "user" | "moderator" | "admin")}>
                            <option value="user">Пользователь</option>
                            <option value="moderator">Модератор</option>
                            <option value="admin">Администратор</option>
                          </select>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <p className="adm-note">Роли и опыт пользователей может менять только владелец проекта. Начисления XP и уровней записываются в отдельный журнал. Владелец может управлять опытом любого пользователя, включая себя.</p>
      </div>
    </main>
  );
}
