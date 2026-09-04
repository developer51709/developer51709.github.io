import { useCallback, useEffect, useState } from 'react';

export const normalizeRoute = (raw: string): string => {
  const path = raw.replace(/^#\/?/, '').replace(/\/+$/, '');
  return path === '' ? '' : path;
};

/**
 * Minimal hash router. Keeps the app deployable to GitHub Pages (no server
 * rewrites needed) while giving a multi-page feel.
 */
export function useHashRoute(): [string, (route: string) => void] {
  const [route, setRoute] = useState(() =>
    normalizeRoute(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = () => {
      setRoute(normalizeRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: string) => {
    const target = `#/${normalizeRoute(next)}`;
    if (window.location.hash === target) {
      setRoute(normalizeRoute(next));
      return;
    }
    window.location.hash = target;
  }, []);

  return [route, navigate];
}
