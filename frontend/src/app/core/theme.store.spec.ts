import { TestBed } from '@angular/core/testing';
import { ThemeStore } from './theme.store';

describe('ThemeStore', () => {
  let store: ThemeStore;

  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    store = TestBed.inject(ThemeStore);
  });

  it('should default to light mode when no preference stored', () => {
    store.init();
    expect(store.isDark()).toBe(false);
  });

  it('should restore dark mode from localStorage', () => {
    localStorage.setItem('app_theme', 'dark');
    store.init();
    expect(store.isDark()).toBe(true);
  });

  it('should toggle from light to dark', () => {
    store.init();
    store.toggle();
    expect(store.isDark()).toBe(true);
    expect(localStorage.getItem('app_theme')).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    localStorage.setItem('app_theme', 'dark');
    store.init();
    store.toggle();
    expect(store.isDark()).toBe(false);
    expect(localStorage.getItem('app_theme')).toBe('light');
  });
});
