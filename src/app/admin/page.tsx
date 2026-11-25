"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type StaffUser = {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "moderator" | "admin" | "owner";
  created_at: string;
};

const roleLabels: Record<StaffUser["role"], string> = {
  user: "Пользователь", moderator: "Модератор", admin: "Администратор", owner: "Владелец"
};

export default function AdminPage() {
  const supabase = getSupabaseBrowserClient();
  const [role, setRole] = useState("");
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

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

  const visibleUsers = users.filter((u) => [u.username, u.display_name || "", u.user_id].join(" ").toLowerCase().includes(search.toLowerCase()));

  return <main style={{minHeight:"100vh",background:"#090810",color:"#f5f2ff",padding:"32px clamp(16px,4vw,56px)",fontFamily:"Arial,sans-serif"}}>
    <div style={{maxWidth:1120,margin:"0 auto"}}>
      <Link href="/" style={{color:"#b9a2ff",textDecoration:"none"}}>← Вернуться в FSG</Link>
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",margin:"28px 0"}}>
        <div><div style={{color:"#b9a2ff",fontSize:11,fontWeight:800,letterSpacing:".16em"}}>FREE STEAM GAME · CONTROL CENTER</div><h1 style={{fontSize:"clamp(30px,5vw,46px)",margin:"10px 0"}}>Панель управления</h1><p style={{color:"#aaa2ba",margin:0}}>Пользователи, роли и контроль доступа</p></div>
        <div style={{border:"1px solid #443568",background:"#171126",borderRadius:12,padding:"12px 16px"}}><div style={{fontSize:10,color:"#aaa2ba"}}>ТВОЯ РОЛЬ</div><strong style={{color:"#c4b5fd"}}>{roleLabels[role as StaffUser["role"]] || role || "Проверка…"}</strong></div>
      </header>
      {message && <div role="status" style={{padding:14,marginBottom:18,border:"1px solid #57437a",borderRadius:10,color:"#ddd1ff",background:"#171126"}}>{message}</div>}
      <section style={{border:"1px solid #292239",background:"#12101d",borderRadius:16,padding:20}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:14,flexWrap:"wrap",alignItems:"center",marginBottom:18}}><div><h2 style={{margin:"0 0 5px"}}>Управление пользователями</h2><span style={{fontSize:12,color:"#9991a9"}}>Показаны последние 200 зарегистрированных профилей</span></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по нику или ID" style={{background:"#090810",border:"1px solid #393047",borderRadius:9,padding:"11px 13px",color:"white",minWidth:230}} /></div>
        {loading ? <p style={{color:"#aaa2ba"}}>Загружаем данные…</p> : visibleUsers.length === 0 ? <p style={{color:"#aaa2ba"}}>Пользователи не найдены.</p> : <div style={{display:"grid",gap:9}}>
          {visibleUsers.map(u=><div key={u.user_id} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:12,alignItems:"center",padding:"13px 0",borderTop:"1px solid #292239"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
              {u.avatar_url ? <img src={u.avatar_url} alt="" style={{width:42,height:42,borderRadius:12,objectFit:"cover"}}/> : <div style={{width:42,height:42,borderRadius:12,display:"grid",placeItems:"center",background:"#48316f",fontWeight:800}}>{(u.display_name||u.username).slice(0,1).toUpperCase()}</div>}
              <div style={{minWidth:0}}><strong style={{display:"block",overflow:"hidden",textOverflow:"ellipsis"}}>{u.display_name || u.username}</strong><span style={{fontSize:11,color:"#9991a9"}}>@{u.username} · {u.user_id.slice(0,8)}…</span></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:9,flexWrap:"wrap",justifyContent:"end"}}><span style={{fontSize:11,color:"#c4b5fd"}}>{roleLabels[u.role]}</span>{role==="owner" && u.role!=="owner" && <select aria-label={"Роль для "+u.username} disabled={busy===u.user_id} value={u.role} onChange={e=>void changeRole(u.user_id,e.target.value as "user"|"moderator"|"admin")} style={{background:"#201a30",color:"white",border:"1px solid #493a64",borderRadius:8,padding:9}}><option value="user">Пользователь</option><option value="moderator">Модератор</option><option value="admin">Администратор</option></select>}</div>
          </div>)}
        </div>}
      </section>
      <p style={{fontSize:11,color:"#777087",lineHeight:1.7,marginTop:18}}>Назначать и снимать роли может только владелец проекта. Все изменения фиксируются в журнале ролей. Удаление аккаунтов и изменение игровых данных здесь пока не включены.</p>
    </div>
  </main>;
}
