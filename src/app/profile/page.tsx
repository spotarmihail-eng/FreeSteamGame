"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileRow = {
  id: string; username: string; profile_slug: string | null; display_name: string | null;
  avatar_url: string | null; bio: string; experience: number; profile_public: boolean;
  show_presence: boolean; show_games: boolean; show_level: boolean; show_experience: boolean;
  show_exact_experience: boolean; show_friends: boolean; show_inventory: boolean;
  show_comments: boolean; comments_allowed: "everyone" | "friends" | "nobody";
  invisible: boolean; custom_status: string; profile_settings: Record<string, unknown>;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const backgrounds = [
  { id: "violet", name: "Фиолетовый космос", style: "linear-gradient(125deg,#24153f,#10101f 55%,#39205d)" },
  { id: "aurora", name: "Северное сияние", style: "linear-gradient(125deg,#102d38,#172044 55%,#44275e)" },
  { id: "ember", name: "Неоновый огонь", style: "linear-gradient(125deg,#3b1b32,#27152d 55%,#5a2b45)" },
  { id: "midnight", name: "Полночь", style: "linear-gradient(125deg,#101522,#17152a 55%,#24203b)" }
];

function levelFromXp(total: number) {
  let xp = Math.max(0, total);
  let level = 0;
  let step = 100;
  while (xp >= step) { xp -= step; level += 1; if (level % 10 === 0) step += 100; }
  return { level, current: xp, next: step, total: total - xp };
}

function slugFrom(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9_-]+/g, "").slice(0, 24);
}

export default function ProfilePage() {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [background, setBackground] = useState("violet");
  const [privacy, setPrivacy] = useState("public");
  const [showLevel, setShowLevel] = useState(true);
  const [showExperience, setShowExperience] = useState(true);
  const [showExactXp, setShowExactXp] = useState(false);
  const [invisible, setInvisible] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [commentsAllowed, setCommentsAllowed] = useState<"everyone" | "friends" | "nobody">("everyone");
  const [showFriends, setShowFriends] = useState(true);
  const [showInventory, setShowInventory] = useState(false);
  const [showcaseSlots, setShowcaseSlots] = useState(2);
  const [favoriteGames, setFavoriteGames] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [textBlocks, setTextBlocks] = useState([{ title: "Обо мне", body: "" }]);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [mediaUploading, setMediaUploading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data: auth } = await supabase.auth.getUser();
      if (!active) return;
      setUser(auth.user);
      if (!auth.user) { setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
      if (!active) return;
      if (data) {
        const p = data as ProfileRow;
        setProfile(p); setDisplayName(p.display_name || p.username); setSlug(p.profile_slug || p.username);
        setBio(p.bio || ""); setCustomStatus(p.custom_status || "");
        const s = p.profile_settings || {};
        setBackground(String(s.background || "violet"));
        setBackgroundImage(String(s.backgroundImage || ""));
        setShowcaseSlots(Number(s.showcaseSlots || 2));
        setFavoriteGames(Array.isArray(s.favoriteGames) ? s.favoriteGames as string[] : []);
        setAchievements(Array.isArray(s.achievements) ? s.achievements as string[] : []);
        setTextBlocks(Array.isArray(s.textBlocks) ? s.textBlocks as {title:string;body:string}[] : [{title:"Обо мне",body:""}]);
        setPrivacy(p.profile_public ? "public" : "private");
        setShowLevel(p.show_level); setShowExperience(p.show_experience); setShowExactXp(p.show_exact_experience);
        setInvisible(p.invisible); setShowComments(p.show_comments); setCommentsAllowed(p.comments_allowed);
        setShowFriends(p.show_friends); setShowInventory(p.show_inventory); setAvatarPreview(p.avatar_url || "");
      } else {
        const meta = auth.user.user_metadata || {};
        const raw = String(meta.user_name || meta.preferred_username || meta.name || auth.user.email?.split("@")[0] || "player");
        const safe = slugFrom(raw) || "player";
        setDisplayName(String(meta.full_name || meta.name || raw)); setSlug(safe);
      }
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [supabase]);

  const xp = Number(profile?.experience || 0);
  const level = useMemo(() => levelFromXp(xp), [xp]);
  const selectedBackground = backgrounds.find((item) => item.id === background) || backgrounds[0];

  async function saveProfile() {
    if (!supabase || !user) return;
    const cleanSlug = slugFrom(slug);
    if (cleanSlug.length < 3) { setMessage("Адрес профиля должен содержать минимум 3 символа латиницей или цифрами."); return; }
    setSaving(true); setMessage("");
    const payload = {
      id: user.id,
      username: profile?.username || cleanSlug,
      profile_slug: cleanSlug,
      display_name: displayName.trim().slice(0, 48),
      avatar_url: avatarPreview || null,
      bio: bio.slice(0, 500),
      profile_public: privacy === "public",
      show_presence: true,
      show_games: true,
      show_level: showLevel,
      show_experience: showExperience,
      show_exact_experience: showExactXp,
      show_friends: showFriends,
      show_inventory: showInventory,
      show_comments: showComments,
      comments_allowed: commentsAllowed,
      invisible,
      custom_status: customStatus.slice(0, 80),
      profile_settings: { background, backgroundImage, showcaseSlots, favoriteGames: favoriteGames.slice(0,5), achievements: achievements.slice(0,10), textBlocks: textBlocks.slice(0,3) }
    };
    const { data, error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" }).select("*").single();
    if (error) setMessage(error.code === "23505" ? "Этот адрес профиля уже занят. Выбери другой." : "Не удалось сохранить профиль: " + error.message);
    else { setProfile(data as ProfileRow); setSlug(cleanSlug); setMessage("Профиль сохранён."); setEditing(false); }
    setSaving(false);
  }

  async function uploadProfileImage(file: File | undefined, kind: "avatar" | "background") {
    if (!file || !supabase || !user) return;
    if (!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("Выбери PNG, JPG, WEBP или GIF размером до 5 МБ."); return;
    }
    setMediaUploading(true); setMessage("");
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "img";
    const path = `${user.id}/${kind}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("profile-media").upload(path, file, { upsert: true, contentType: file.type });
    if (error) setMessage("Не удалось загрузить изображение. Проверь, применена ли миграция 0003: " + error.message);
    else {
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
      if (kind === "avatar") setAvatarPreview(data.publicUrl);
      else setBackgroundImage(data.publicUrl);
      setMessage("Изображение загружено. Не забудь сохранить профиль.");
    }
    setMediaUploading(false);
  }

  if (loading) return <main className="profile-page"><div className="profile-loading">Загружаем профиль…</div></main>;
  if (!user) return <main className="profile-page"><section className="profile-login"><span className="profile-kicker">FREE STEAM GAME</span><h1>Твой игровой профиль</h1><p>Войди через Discord, чтобы настроить профиль, витрины и приватность.</p><a className="profile-primary" href={`${basePath}/login/`}>Войти через Discord ↗</a><a className="profile-back" href={`${basePath}/`}>← На главную</a></section></main>;

  return (
    <main className="profile-page">
      <header className="profile-top"><a href={`${basePath}/`} className="profile-brand"><span>F</span> FREE STEAM <b>GAME</b></a><nav><a href={`${basePath}/`}>Главная</a><a href="#showcases">Витрины</a><button onClick={() => setEditing(!editing)}>{editing ? "Закрыть редактор" : "Настроить профиль"}</button></nav></header>
      <div className="profile-content">
        <div className="profile-heading"><div><span className="profile-kicker">ИГРОВОЙ ПРОФИЛЬ</span><h1>{displayName || "Игрок"}</h1><p>Твоя страница в сообществе Free Steam Game</p></div><div className="profile-actions"><button className="profile-secondary" onClick={() => setPreview(!preview)}>{preview ? "Вернуться к профилю" : "Предпросмотр"}</button><button className="profile-primary" onClick={saveProfile} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить"}</button></div></div>
        <section className="profile-hero" style={backgroundImage ? { backgroundImage: `linear-gradient(90deg,rgba(8,7,15,.82),rgba(8,7,15,.18)),url("${backgroundImage}")`, backgroundSize: "cover", backgroundPosition: "center" } : {background: selectedBackground.style}}>
          <div className="profile-hero-overlay" />
          <div className="profile-avatar-wrap">{avatarPreview ? <img src={avatarPreview} alt="Аватар профиля" /> : <span>{(displayName || "И").slice(0,1).toUpperCase()}</span>}</div>
          <div className="profile-identity"><span className="profile-online"><i /> {invisible ? "Невидимка" : "В сети"}</span><h2>{displayName || "Игрок"}</h2><p>{customStatus || "Добро пожаловать в мой профиль FSG"}</p><small>Уровень {level.level} · {level.current} / {level.next} XP</small></div>
          <div className="profile-level-badge">✦<b>{level.level}</b><small>УРОВЕНЬ</small></div>
        </section>
        {!preview && editing ? <section className="profile-editor">
          <div className="profile-section-title"><div><span className="profile-kicker">РЕДАКТОР</span><h2>Настройка профиля</h2></div><span>Изменения сохраняются в Supabase</span></div>
          <div className="profile-form-grid">
            <label>Никнейм<input value={displayName} maxLength={48} onChange={(e)=>setDisplayName(e.target.value)} /></label>
            <label>Уникальный адрес /u/<input value={slug} maxLength={24} onChange={(e)=>setSlug(slugFrom(e.target.value))} /></label>
            <label className="profile-wide">Описание<textarea value={bio} maxLength={500} onChange={(e)=>setBio(e.target.value)} placeholder="Расскажи немного о себе…" /></label>
            <label className="profile-wide">Собственный статус<input value={customStatus} maxLength={80} onChange={(e)=>setCustomStatus(e.target.value)} placeholder="Например: Играю в любимую игру" /></label>
            <label>Аватар (PNG/JPG/WEBP/GIF, до 5 МБ)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={mediaUploading} onChange={(e)=>void uploadProfileImage(e.target.files?.[0], "avatar")} /></label>
            <label>Видимость профиля<select value={privacy} onChange={(e)=>setPrivacy(e.target.value)}><option value="public">Открытый</option><option value="private">Приватный</option></select></label>
          </div>
          <div className="profile-editor-group"><h3>Фон профиля</h3><div className="profile-backgrounds">{backgrounds.map((item)=><button key={item.id} className={background===item.id?"selected":""} style={{background:item.style}} onClick={()=>setBackground(item.id)}>{item.name}</button>)}</div><label className="profile-upload-background">Загрузить собственный фон (до 5 МБ)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={mediaUploading} onChange={(e)=>void uploadProfileImage(e.target.files?.[0], "background")} /></label><p className="profile-muted">Можно выбрать готовый фон или загрузить собственное изображение. Анимированные темы и эффекты будут добавлены отдельным этапом.</p></div>
          <div className="profile-editor-group"><h3>Приватность и отображение</h3><div className="profile-toggles">
            <label><input type="checkbox" checked={showLevel} onChange={e=>setShowLevel(e.target.checked)}/> Показывать уровень</label>
            <label><input type="checkbox" checked={showExperience} onChange={e=>setShowExperience(e.target.checked)}/> Показывать шкалу опыта</label>
            <label><input type="checkbox" checked={showExactXp} onChange={e=>setShowExactXp(e.target.checked)}/> Показывать точное количество XP</label>
            <label><input type="checkbox" checked={invisible} onChange={e=>setInvisible(e.target.checked)}/> Режим невидимки</label>
            <label><input type="checkbox" checked={showFriends} onChange={e=>setShowFriends(e.target.checked)}/> Показывать список друзей</label>
            <label><input type="checkbox" checked={showInventory} onChange={e=>setShowInventory(e.target.checked)}/> Показывать инвентарь</label>
            <label><input type="checkbox" checked={showComments} onChange={e=>setShowComments(e.target.checked)}/> Разрешить комментарии</label>
          </div><label className="profile-inline-label">Кто может комментировать<select value={commentsAllowed} onChange={e=>setCommentsAllowed(e.target.value as "everyone"|"friends"|"nobody")}><option value="everyone">Все</option><option value="friends">Только друзья</option><option value="nobody">Никто</option></select></label></div>
          <div className="profile-editor-group"><h3>Витрины и блоки</h3><p className="profile-muted">Начальные слоты: {showcaseSlots}. Дополнительные слоты задуманы как награды за уровни. Перетаскивание и размер блоков подключим следующим этапом.</p><label>Количество открытых слотов<select value={showcaseSlots} onChange={e=>setShowcaseSlots(Number(e.target.value))}><option value={2}>2 слота</option><option value={3}>3 слота</option><option value={4}>4 слота</option><option value={5}>5 слотов</option><option value={6}>6 слотов</option></select></label>
            <div className="profile-form-grid"><label>Любимые игры (до 5, названия через запятую)<input value={favoriteGames.join(", ")} onChange={e=>setFavoriteGames(e.target.value.split(",").map(v=>v.trim()).filter(Boolean).slice(0,5))} placeholder="Dota 2, Warframe…" /></label><label>Достижения (до 10, названия через запятую)<input value={achievements.join(", ")} onChange={e=>setAchievements(e.target.value.split(",").map(v=>v.trim()).filter(Boolean).slice(0,10))} placeholder="Первый значок, Коллекционер…" /></label></div>
            <h3>Свои текстовые блоки (до 3)</h3>{textBlocks.map((block,index)=><div className="profile-text-block" key={index}><input value={block.title} onChange={e=>setTextBlocks(old=>old.map((v,i)=>i===index?{...v,title:e.target.value}:v))} placeholder="Заголовок" /><textarea value={block.body} onChange={e=>setTextBlocks(old=>old.map((v,i)=>i===index?{...v,body:e.target.value}:v))} placeholder="Текст блока" /><button onClick={()=>setTextBlocks(old=>old.filter((_,i)=>i!==index))}>Удалить блок</button></div>)}{textBlocks.length<3?<button className="profile-secondary" onClick={()=>setTextBlocks(old=>[...old,{title:"Новый раздел",body:""}])}>+ Добавить текстовый блок</button>:null}
          </div>
          <button className="profile-primary" onClick={saveProfile} disabled={saving || mediaUploading}>{saving?"Сохраняем…":mediaUploading?"Загружаем изображение…":"Сохранить настройки"}</button>
        </section> : null}
        <section id="showcases" className="profile-showcases"><div className="profile-section-title"><div><span className="profile-kicker">ТВОЯ КОЛЛЕКЦИЯ</span><h2>Витрины профиля</h2></div><span>{showcaseSlots} открытых слота</span></div>
          <div className="profile-showcase-grid">
            <article><span className="showcase-icon">✧</span><h3>Любимые игры</h3><p>{favoriteGames.length?favoriteGames.join(" · "):"Выбери до 5 игр из своей библиотеки."}</p></article>
            <article><span className="showcase-icon">🏆</span><h3>Достижения</h3><p>{achievements.length?achievements.join(" · "):"Выбери до 10 любимых достижений."}</p></article>
            <article><span className="showcase-icon">♧</span><h3>Лучший друг</h3><p>Витрина для одного выбранного друга появится после подключения списка друзей.</p></article>
            <article><span className="showcase-icon">▤</span><h3>Карточки и предметы</h3><p>Хранятся в отдельном инвентаре. Можно будет выбрать, что показать на витрине.</p></article>
          </div>
          {textBlocks.filter(v=>v.body.trim()).map((block,i)=><article className="profile-text-preview" key={i}><h3>{block.title}</h3><p>{block.body}</p></article>)}
        </section>
        <section className="profile-xp-card"><div><span className="profile-kicker">ПРОГРЕСС FSG</span><h2>Уровень {level.level}</h2><p>Опыт начисляется за создание значков из полных наборов карточек. Каждое создание — 100 XP, максимум 5 уровней одного значка.</p></div><div className="profile-xp-track"><div><span>{showExactXp?xp+" XP":showExperience?"Прогресс уровня":"Скрыто"}</span><b>{level.next-level.current} XP до следующего уровня</b></div><div className="profile-progress"><i style={{width:`${Math.min(100,level.current/level.next*100)}%`}} /></div></div></section>
        <section className="profile-share"><div><h3>Поделиться профилем</h3><p>Твоя ссылка: /u/{slug || "player"}</p></div><button className="profile-secondary" onClick={()=>{void navigator.clipboard?.writeText(`${window.location.origin}${basePath}/profile/?u=${encodeURIComponent(slug)}`);setMessage("Ссылка скопирована.");}}>Копировать ссылку ↗</button></section>
        {message?<p className="profile-message" role="status">{message}</p>:null}
        <footer className="profile-footer">Free Steam Game is not affiliated with, endorsed by, or sponsored by Valve Corporation or Steam. All trademarks belong to their respective owners.</footer>
      </div>
    </main>
  );
}
