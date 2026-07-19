import React from 'react';
import ReactDOM from 'react-dom/client';
import GitProfile from './components/gitprofile.tsx';
import NotFoundPage from './components/not-found-page/index.tsx';

// Apply the active theme before first render so all pages (including 404) inherit it.
// Mirrors the logic in getInitialTheme: prefer localStorage, then system preference, then config default.
const _themes: string[] = CONFIG.themeConfig?.themes ?? [];
const _defaultTheme: string = CONFIG.themeConfig?.defaultTheme ?? 'light';
const _disableSwitch: boolean = CONFIG.themeConfig?.disableSwitch ?? false;
const _respectSystem: boolean = CONFIG.themeConfig?.respectPrefersColorScheme ?? false;

let _activeTheme = _defaultTheme;
if (!_disableSwitch) {
  const _saved = localStorage.getItem('gitprofile-theme');
  if (_saved && _themes.includes(_saved)) {
    _activeTheme = _saved;
  } else if (_respectSystem) {
    _activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}
document.documentElement.setAttribute('data-theme', _activeTheme);

const base = (CONFIG.base ?? '/').replace(/\/+$/, '') || '/';
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const isKnownPath = pathname === base || pathname.startsWith(base + '/');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isKnownPath ? <GitProfile config={CONFIG} /> : <NotFoundPage />}
  </React.StrictMode>,
);
