import { AuthStatus } from "@/components/auth-status";
import { Icon, type IconName } from "@/components/icons";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const games = [
  { name: "Dota 2", genre: "MOBA · Экшен", appId: "570", initials: "D2", players: "Командная стратегия", color: "dota", label: "Популярная" },
  { name: "Team Fortress 2", genre: "Шутер · Командная", appId: "440", initials: "TF2", players: "Динамичные матчи", color: "tf2", label: "Классика" },
  { name: "Warframe", genre: "Экшен · RPG", appId: "230410", initials: "W", players: "Космические приключения", color: "warframe", label: "Приключение" }
];

const navItems: { icon: IconName; label: string; href: string; active?: boolean }[] = [
  { icon: "home", label: "Обзор", href: "#top", active: true },
  { icon: "grid", label: "Каталог игр", href: "#games" },
  { icon: "library", label: "Библиотека", href: "#library" },
  { icon: "sparkles", label: "Коллекции", href: "#collection" },
  { icon: "users", label: "Сообщество", href: "#community" },
  { icon: "user", label: "Мой профиль", href: `${basePath}/profile/` }
];

const features: { icon: IconName; title: string; text: string }[] = [
  { icon: "library", title: "Твоя библиотека", text: "Собирай бесплатные игры и держи интересные проекты в одном месте." },
  { icon: "users", title: "Играй вместе", text: "Находи друзей, следи за игровым статусом и приглашай в совместные сессии." },
  { icon: "sparkles", title: "Собирай коллекции", text: "Получай собственные карточки Free Steam Game и создавай игровые значки." }
];

function Mark() {
  return (
    <span className="brand-mark has-logo" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${basePath}/img/brand/logo-128.webp`} alt="" width={38} height={38} />
    </span>
  );
}

export default function HomePage() {
  return (
    <main id="top" className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Free Steam Game — на главную">
          <Mark />
          <span className="brand-name">FREE STEAM <b>GAME</b></span>
        </a>

        <div className="side-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav className="side-nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className={item.active ? "side-link active" : "side-link"}>
              <span className="side-icon" aria-hidden="true"><Icon name={item.icon} /></span>
              <span>{item.label}</span>
              {item.active ? <span className="nav-indicator" /> : null}
            </a>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="side-label">ТВОЙ ПРОФИЛЬ</div>
          <AuthStatus />
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumbs"><span>Free Steam Game</span><i>/</i><strong>Обзор</strong></div>
          <div className="topbar-actions">
            <span className="preview-pill"><span /> РАННИЙ ПРЕДПРОСМОТР</span>
            <AuthStatus compact />
          </div>
        </header>

        <div className="content-wrap">
          <section className="welcome-grid">
            <div className="welcome-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> ИГРОВОЕ ПРОСТРАНСТВО СООБЩЕСТВА</div>
              <h1>Игры. Друзья.<br /><span>Твои достижения.</span></h1>
              <p className="welcome-description">Открывай бесплатные игры, собирай собственные коллекции карточек и находи игроков для новых приключений.</p>
              <div className="welcome-actions">
                <a className="button-primary" href="#games">Исследовать игры <span aria-hidden="true">↗</span></a>
                <a className="button-quiet" href="#collection">Мои коллекции <span aria-hidden="true">→</span></a>
              </div>
              <div className="welcome-footnote"><span className="pulse-dot" /> Проект активно разрабатывается. Некоторые функции пока демонстрационные.</div>
            </div>

            <div className="hero-visual">
              <div className="hero-visual-glow" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${basePath}/img/brand/banner-1600.webp`}
                srcSet={`${basePath}/img/brand/banner-800.webp 800w, ${basePath}/img/brand/banner-1600.webp 1600w`}
                sizes="(max-width: 900px) 100vw, 560px"
                width={1600}
                height={900}
                alt="Free Steam Game — играй, собирай, развивайся"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </section>

          <section className="stats-row" aria-label="О проекте">
            <div className="stat-item"><span className="stat-icon"><Icon name="grid" size={17} /></span><div><strong>Игровой каталог</strong><span>Бесплатные игры и раздачи</span></div></div>
            <div className="stat-item"><span className="stat-icon"><Icon name="sparkles" size={17} /></span><div><strong>Свои коллекции</strong><span>Карточки и значки по играм</span></div></div>
            <div className="stat-item"><span className="stat-icon"><Icon name="users" size={17} /></span><div><strong>Игровое сообщество</strong><span>Друзья и совместные сессии</span></div></div>
          </section>

          <section id="games" className="section-block">
            <div className="section-heading">
              <div><div className="section-kicker">НАЧНИ С ЭТОГО</div><h2>Игры для знакомства</h2><p>Несколько бесплатных игр, с которых начинается каталог.</p></div>
              <a className="text-link" href="https://store.steampowered.com/genre/Free%20to%20Play/" target="_blank" rel="noreferrer">Все бесплатные игры в Steam <span>↗</span></a>
            </div>
            <div className="games-grid">
              {games.map((game) => (
                <article className="game-card" key={game.appId}>
                  <a className={`game-art ${game.color}`} href={`https://store.steampowered.com/app/${game.appId}/`} target="_blank" rel="noreferrer" aria-label={`Открыть ${game.name} в Steam`}>
                    <span className="game-art-label">{game.label}</span><span className="game-monogram">{game.initials}</span><span className="game-art-orb" />
                    <span className="game-art-open">↗</span>
                  </a>
                  <div className="game-card-info"><div><h3>{game.name}</h3><p>{game.genre}</p></div><span className="free-tag">FREE</span></div>
                  <div className="game-card-footer"><span>{game.players}</span><a href={`https://store.steampowered.com/app/${game.appId}/`} target="_blank" rel="noreferrer">Страница игры ↗</a></div>
                </article>
              ))}
            </div>
            <p className="content-disclaimer">Список демонстрационный. Доступность и условия бесплатной игры проверяй на официальной странице Steam.</p>
          </section>

          <section id="library" className="library-banner">
            <div className="library-symbol"><Icon name="library" size={22} /></div>
            <div className="library-copy"><div className="section-kicker">ТВОЯ БИБЛИОТЕКА</div><h2>Всё любимое — в одном месте</h2><p>Отмечай игры, сохраняй интересное и возвращайся к своим открытиям.</p></div>
            <span className="coming-tag">СКОРО</span>
          </section>

          <section id="collection" className="section-block collection-section">
            <div className="section-heading">
              <div><div className="section-kicker">СОБИРАЙ И ДОСТИГАЙ</div><h2>Коллекции и значки</h2><p>Отдельная система карточек Free Steam Game — для каждой игры свой набор.</p></div>
              <span className="collection-level">ДО 5 УРОВНЕЙ ЗНАЧКА</span>
            </div>
            <div className="collection-grid">
              <div className="collection-card collection-card-main"><div className="collection-card-top"><span>КОЛЛЕКЦИОННЫЙ НАБОР</span><span className="tiny-status">КОНЦЕПТ</span></div><div className="collectible-row"><div className="collectible-card card-a"><span>✦</span><b>I</b><small>ОТКРЫТИЕ</small></div><div className="collectible-card card-b"><span>◈</span><b>II</b><small>ИССЛЕДОВАТЕЛЬ</small></div><div className="collectible-card card-c"><span>✧</span><b>III</b><small>ПЕРВОПРОХОДЕЦ</small></div><div className="collectible-card card-d"><span>✺</span><b>IV</b><small>МАСТЕР</small></div></div><p>Карточки одного набора используются только для значка соответствующей игры.</p></div>
              <div className="collection-card official-card"><div className="official-icon">S</div><div><h3>Steam Trading Cards</h3><p>Официальные карточки Steam существуют отдельно. Сайт не управляет их выпадением, инвентарём или значками.</p><span className="official-label">ОТДЕЛЬНО ОТ КОЛЛЕКЦИЙ FSG</span></div></div>
            </div>
          </section>

          <section id="community" className="community-strip"><div className="community-icon"><Icon name="users" size={22} /></div><div><h2>Играть интереснее вместе</h2><p>Друзья, статусы и приглашения появятся после подключения безопасного входа и серверной части.</p></div><span className="coming-tag">В РАЗРАБОТКЕ</span></section>

          <section className="features-section">
            <div className="section-kicker">ОДНО ПРОСТРАНСТВО — МНОГО ВОЗМОЖНОСТЕЙ</div><h2>Создано для твоего игрового мира</h2>
            <div className="features-grid">{features.map((feature) => <article className="feature-card" key={feature.title}><span className="feature-icon"><Icon name={feature.icon} size={17} /></span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
          </section>

          <footer className="footer"><a className="footer-brand" href="#top"><Mark /><span>FREE STEAM <b>GAME</b></span></a><p>Игровое пространство для коллекций, достижений и новых открытий.</p><span className="footer-copy">© {new Date().getFullYear()} Free Steam Game · Независимый проект сообщества</span></footer>
        </div>
      </div>
    </main>
  );
}
