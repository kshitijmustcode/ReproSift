'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

type Theme = 'dark' | 'light';

const storageKey = 'reprosift-theme';
const themeChangeEvent = 'reprosift-theme-change';

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function subscribeToThemeChange(onStoreChange: () => void): () => void {
  window.addEventListener(themeChangeEvent, onStoreChange);
  return () => window.removeEventListener(themeChangeEvent, onStoreChange);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToThemeChange, readTheme, () => 'light');

  const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';

  function toggleTheme() {
    const activeTheme = readTheme();
    const updatedTheme: Theme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = updatedTheme;
    try {
      localStorage.setItem(storageKey, updatedTheme);
    } catch {
      // The visual preference still works when storage is unavailable.
    }
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === 'dark' ? (
        <Sun aria-hidden="true" size={16} />
      ) : (
        <Moon aria-hidden="true" size={16} />
      )}
      <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}
