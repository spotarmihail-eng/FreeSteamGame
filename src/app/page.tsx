import { AuthStatus } from "@/components/auth-status";

const games = [
  { name: "Dota 2", genre: "MOBA · Экшен", appId: "570", initials: "D2", players: "Командная стратегия", color: "dota", label: "Популярная" },
  { name: "Team Fortress 2", genre: "Шутер · Командная", appId: "440", initials: "TF2", players: "Динамичные матчи", color: "tf2", label: "Классика" },
  { name: "Warframe", genre: "Экшен · RPG", appId: "230410", initials: "W", players: "Космические приключения", color: "warframe", label: "Приключение" }
];

const navItems = [
  { icon: "⌂", label: "Обзор", href: "#top", active: true },
  { icon: "▦", label: "Каталог игр", href: "#games" },
  { icon: "▤", label: "Библиотека", href: "#library" },
  { icon: "✧", label: "Коллекции", href: "#collection" },
  { icon: "♧", label: "Сообщество", href: "#community" }
];

const features = [
  { icon: "▤", title: "Твоя библиотека", text: "Собирай бесплатные игры и держи интересные проекты в одном месте." },
  { icon: "♧", title: "Играй вместе", text: "Находи друзей, следи за игровым статусом и приглашай в совместные сессии." },
  { icon: "✧", title: "Собирай коллекции", text: "Получай собственные карточки Free Steam Game и создавай игровые значки." }
];

function Mark({ children }: { children: React.ReactNode }) {
  return <span className="brand-mark" aria-hidden="true">{children}</span>;
}

export default function HomePage() {
  return (
    <main id="top" className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Free Steam Game — на главную">
          <Mark>F</Mark>
          <span className="brand-name">FREE STEAM <b>GAME</b></span>
        </a>

        <div className="side-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav className="side-nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className={item.active ? "side-link active" : "side-link"}>
              <span className="side-icon" aria-hidden="true">{item.icon}</span>
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

            <div className="feature-panel">
              <div className="feature-panel-glow" />
              <div className="feature-panel-top"><span className="panel-kicker">ТВОЯ ИГРОВАЯ ВСЕЛЕННАЯ</span><span className="panel-orbit">✳</span></div>
              <div className="orbit-art" aria-hidden="true">
                <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
                <div className="orbit-core"><span>F</span></div>
                <span className="orbit-star star-one">✦</span><span className="orbit-star star-two">✧</span><span className="orbit-star star-three">✦</span>
              </div>
              <div className="feature-panel-bottom"><div><strong>Твоя история начинается здесь</strong><span>Один профиль для игрового сообщества</span></div><span className="arrow-round">↗</span></div>
            </div>
          </section>

          <section className="stats-row" aria-label="О проекте">
            <div className="stat-item"><span className="stat-icon">▦</span><div><strong>Игровой каталог</strong><span>Бесплатные игры и раздачи</span></div></div>
            <div className="stat-item"><span className="stat-icon">✧</span><div><strong>Свои коллекции</strong><span>Карточки и значки по играм</span></div></div>
            <div className="stat-item"><span className="stat-icon">♧</span><div><strong>Игровое сообщество</strong><span>Друзья и совместные сессии</span></div></div>
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
            <div className="library-symbol">▤</div>
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

          <section id="community" className="community-strip"><div className="community-icon">♧</div><div><h2>Играть интереснее вместе</h2><p>Друзья, статусы и приглашения появятся после подключения безопасного входа и серверной части.</p></div><span className="coming-tag">В РАЗРАБОТКЕ</span></section>

          <section className="features-section">
            <div className="section-kicker">ОДНО ПРОСТРАНСТВО — МНОГО ВОЗМОЖНОСТЕЙ</div><h2>Создано для твоего игрового мира</h2>
            <div className="features-grid">{features.map((feature) => <article className="feature-card" key={feature.title}><span className="feature-icon">{feature.icon}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
          </section>

          <footer className="footer"><a className="footer-brand" href="#top"><Mark>F</Mark><span>FREE STEAM <b>GAME</b></span></a><p>Free Steam Game is not affiliated with, endorsed by, or sponsored by Valve Corporation or Steam. All trademarks belong to their respective owners.</p><span className="footer-copy">© {new Date().getFullYear()} Free Steam Game · Независимый проект сообщества</span></footer>
        </div>
      </div>
    </main>
  );
}
