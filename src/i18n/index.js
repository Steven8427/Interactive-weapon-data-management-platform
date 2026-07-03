import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations, LANGS } from './translations';

const STORAGE_KEY = 'site_lang';

// URL path prefix <-> language. zh is the default (no prefix).
const PREFIX_TO_LANG = { en: 'en', ja: 'ja', ko: 'ko', 'zh-tw': 'zh-TW' };
const LANG_TO_PREFIX = { en: '/en', ja: '/ja', ko: '/ko', 'zh-TW': '/zh-tw' };

// The url segment for a language ('' for zh default).
export function langPrefix(code) { return LANG_TO_PREFIX[code] || ''; }

// Resolve the language + router basename from the current URL path prefix.
export function resolveRoute() {
  try {
    const seg = (window.location.pathname.split('/')[1] || '').toLowerCase();
    if (PREFIX_TO_LANG[seg]) return { lang: PREFIX_TO_LANG[seg], basename: '/' + seg };
  } catch (e) { /* ignore */ }
  return { lang: null, basename: '/' };
}

function detectDefault() {
  try {
    // 1) language path prefix (/en, /ja, /ko, /zh-tw) is authoritative for the page
    const routed = resolveRoute();
    if (routed.lang) return routed.lang;
    // 2) explicit ?lang= in the URL (hreflang / shared links)
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q && LANGS.some(l => l.code === q)) return q;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS.some(l => l.code === saved)) return saved;
    const nav = (navigator.language || 'zh').toLowerCase();
    if (nav.startsWith('zh')) return nav.includes('tw') || nav.includes('hk') || nav.includes('hant') ? 'zh-TW' : 'zh';
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('ko')) return 'ko';
    if (nav.startsWith('en')) return 'en';
  } catch (e) { /* ignore */ }
  return 'zh';
}

const I18nContext = createContext({ lang: 'zh', setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectDefault);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    try { document.documentElement.lang = lang; } catch (e) { /* ignore */ }
  }, [lang]);

  const setLang = useCallback((l) => setLangState(l), []);

  const t = useCallback((key, vars) => {
    let str = key;
    if (lang !== 'zh') {
      const dict = translations[lang] || {};
      if (dict[key] != null) str = dict[key];
    }
    if (vars) {
      for (const k of Object.keys(vars)) {
        str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      }
    }
    return str;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}

export function LanguageSwitcher({ dropUp = false, fullWidth = false }) {
  const { lang } = useT();
  const [open, setOpen] = useState(false);
  const current = LANGS.find(l => l.code === lang) || LANGS[0];

  // Switching language navigates to the same page under that language's URL
  // prefix, so the URL is crawlable/shareable and the right static file loads.
  function switchTo(code) {
    const { basename } = resolveRoute();
    let rest = window.location.pathname;
    if (basename !== '/' && rest.toLowerCase().indexOf(basename.toLowerCase()) === 0) {
      rest = rest.slice(basename.length) || '/';
    }
    if (!rest.startsWith('/')) rest = '/' + rest;
    let target = langPrefix(code) + (rest === '/' ? '/' : rest);
    target = target.replace(/\/{2,}/g, '/');
    try { localStorage.setItem(STORAGE_KEY, code); } catch (e) { /* ignore */ }
    window.location.assign(target);
  }

  return (
    <div className="lang-switcher" style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <button
        className="lang-btn"
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          justifyContent: fullWidth ? 'center' : 'flex-start',
          width: fullWidth ? '100%' : 'auto',
          background: 'transparent', border: '1px solid var(--border, #1a3048)',
          color: 'var(--text, #d0e8f0)', borderRadius: 6, padding: '5px 10px',
          fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <span>🌐</span>
        <span>{current.label}</span>
        <span style={{ fontSize: 9, opacity: 0.7 }}>{dropUp ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', zIndex: 1000,
            ...(dropUp ? { bottom: '110%' } : { top: '110%' }),
            ...(fullWidth ? { left: 0, right: 0 } : { right: 0 }),
            background: 'var(--bg-card, #0c1a2a)', border: '1px solid var(--border, #1a3048)',
            borderRadius: 8, padding: 4, minWidth: 130,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {LANGS.map(l => (
            <button
              key={l.code}
              onMouseDown={() => { setOpen(false); switchTo(l.code); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: l.code === lang ? 'var(--border, #1a3048)' : 'transparent',
                border: 'none', color: 'var(--text, #d0e8f0)', borderRadius: 6,
                padding: '8px 12px', fontSize: 13, cursor: 'pointer',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
