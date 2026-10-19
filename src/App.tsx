import { useState } from 'react';
import { getMessages, type PageId } from './i18n';
import './styles.css';

const pageIds: PageId[] = ['home', 'workspace', 'plugins', 'settings'];

export default function App() {
  const [page, setPage] = useState<PageId>('home');
  const messages = getMessages(navigator.language);
  const current = messages.pages[page];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>
          <div className="brand-copy">
            <div className="brand-name">{messages.appName}</div>
            <div className="brand-caption">{messages.prototype}</div>
          </div>
        </div>

        <nav className="navigation" aria-label={messages.navigation}>
          {pageIds.map((id, index) => (
            <button
              key={id}
              type="button"
              aria-label={messages.pages[id].label}
              className={`nav-item${page === id ? ' active' : ''}`}
              aria-current={page === id ? 'page' : undefined}
              onClick={() => setPage(id)}
            >
              <span className="nav-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className="nav-label">{messages.pages[id].label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer" aria-label={messages.status}><span className="status-dot" aria-hidden="true" /><span className="status-label">{messages.status}</span></div>
      </aside>

      <main className="main-panel" id="main-content">
        <header className="topbar">
          <span className="breadcrumb">{messages.appName} <span aria-hidden="true">/</span> {current.label}</span>
          <span className="topbar-tag">PREVIEW 0.1</span>
        </header>
        <section className="content" aria-labelledby="page-title">
          <div className="content-intro">
            <span className="eyebrow">{messages.prototype}</span>
            <h1 id="page-title">{current.title}</h1>
            <p>{current.description}</p>
          </div>
          {page === 'home' ? (
            <>
              <div className="welcome-panel">
                <div><span className="eyebrow">{messages.firstStep}</span><h2>{messages.welcomeTitle}</h2><p>{messages.welcomeDescription}</p></div>
                <div className="welcome-art" aria-hidden="true"><span /><span /><span /></div>
              </div>
              <h2 className="section-title">{messages.explore}</h2>
              <div className="module-grid">
                {messages.modules.map((module) => (
                  <article className="module-card" key={module.title}>
                    <span className="module-icon" aria-hidden="true">{module.symbol}</span>
                    <h3>{module.title}</h3><p>{module.description}</p><span className="module-status">{module.status}</span>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <div className="empty-symbol" aria-hidden="true"><span /><span /></div>
              <div className="empty-label">{messages.emptyLabel}</div>
              <p>{current.description}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
