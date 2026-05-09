import { Injectable, effect, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const THEME_KEY = 'app_theme';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly doc = inject(DOCUMENT);

  private readonly _isDark = signal(false);
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    effect(() => {
      const theme = this._isDark() ? 'dark' : 'light';
      this.doc.documentElement.dataset['theme'] = theme;
    });
  }

  init(): void {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this._isDark.set(stored === 'dark' || (stored === null && prefersDark));
  }

  toggle(): void {
    this._isDark.update((v) => !v);
    localStorage.setItem(THEME_KEY, this._isDark() ? 'dark' : 'light');
  }
}
