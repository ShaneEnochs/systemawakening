// core/dom.ts — Dom interface, DOM construction helper, and title helpers
//
// Centralises all getElementById/querySelector calls into one place.
// Every field is typed as its specific element type so the rest of the
// engine can use them without null-checks on every access.
//
// Also exports setChapterTitle, showChapterCard, and setGameTitle so engine.ts
// can stay slim — these are purely DOM-manipulation helpers with no side-effects
// beyond modifying text content and triggering CSS animations.

export interface Dom {
  narrativeContent: HTMLElement;
  choiceArea:       HTMLElement;
  chapterTitle:     HTMLElement;
  narrativePanel:   HTMLElement;
  statusPanel:      HTMLElement;
  menuBtn:          HTMLElement;
  menuPopover:      HTMLElement;
  menuItemStatus:   HTMLElement;
  menuItemSave:     HTMLElement;
  menuItemRestart:  HTMLElement;
  gameTitle:        HTMLElement;
  splashTitle:      HTMLElement;
  splashTagline:    HTMLElement;
  splashOverlay:    HTMLElement;
  splashNewBtn:     HTMLElement;
  splashLoadBtn:    HTMLElement;
  splashSlots:      HTMLElement;
  splashSlotsBack:  HTMLElement;
  saveOverlay:      HTMLElement;
  saveMenuClose:    HTMLElement;
  charOverlay:      HTMLElement;
  inputFirstName:   HTMLInputElement;
  inputLastName:    HTMLInputElement;
  counterFirst:     HTMLElement;
  counterLast:      HTMLElement;
  errorFirstName:   HTMLElement;
  errorLastName:    HTMLElement;
  charBeginBtn:     HTMLButtonElement;
  endingOverlay:    HTMLElement | null;
  endingTitle:      HTMLElement | null;
  endingContent:    HTMLElement | null;
  endingStats:      HTMLElement | null;
  endingActionBtn:  HTMLElement | null;
  storeOverlay:     HTMLElement | null;
  toast:            HTMLElement;
}

import { setChapterTitleState } from './state.js';

// ---------------------------------------------------------------------------
// Chapter card log callback — injected from engine.ts to avoid core→ui import.
// ---------------------------------------------------------------------------
let _pushChapterCardLog: ((entry: { type: string; text: string; label: string }) => void) | null = null;

export function registerChapterCardLog(fn: (entry: { type: string; text: string; label: string }) => void): void {
  _pushChapterCardLog = fn;
}

// ---------------------------------------------------------------------------
// setChapterTitle — updates the chapter title DOM element and engine state.
// Supports optional [Label] prefix in the title string:
//   *title [Prologue] The End of the World
//   → chapter-bar shows "The End of the World", card label shows "Prologue"
//   *title The End of the World
//   → chapter-bar shows "The End of the World", card label shows "Chapter"
// ---------------------------------------------------------------------------
export function setChapterTitle(t: string): void {
  const m = t.match(/^\[([^\]]+)\]\s+(.+)$/);
  const label      = m ? m[1] : 'Chapter';
  const cleanTitle = m ? m[2] : t;

  const el   = document.getElementById('chapter-title');
  const prev = el?.textContent ?? '';
  if (el) el.textContent = cleanTitle;
  setChapterTitleState(cleanTitle);
  if (cleanTitle && cleanTitle !== prev && cleanTitle !== '—') showChapterCard(cleanTitle, label);

  const labelEl = document.getElementById('chapter-bar-label');
  if (labelEl) {
    labelEl.textContent = '';
    labelEl.classList.add('hidden');
  }
}

export function showChapterCard(title: string, label = 'Chapter'): void {
  document.querySelector('.chapter-card')?.remove();
  const card = document.createElement('div');
  card.className = 'chapter-card';
  const lbl  = document.createElement('span');
  lbl.className = 'chapter-card-label';
  lbl.textContent = label;
  const ttl  = document.createElement('span');
  ttl.className = 'chapter-card-title';
  ttl.textContent = title;
  card.appendChild(lbl);
  card.appendChild(ttl);
  const nc = document.getElementById('narrative-content');
  const ca = document.getElementById('choice-area');
  if (nc && ca) nc.insertBefore(card, ca);
  if (_pushChapterCardLog) _pushChapterCardLog({ type: 'chapter-card', text: title, label });
}

export function setGameTitle(t: string): void {
  const gt = document.getElementById('game-title');
  const st = document.querySelector('.splash-title') as HTMLElement | null;
  if (gt) gt.textContent = t;
  if (st) st.textContent = t;
  document.title = t;
}

// ---------------------------------------------------------------------------
// buildDom
// ---------------------------------------------------------------------------
export function buildDom(): Dom {
  function req(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) console.warn(`[dom] Missing element: "${id}" — check index.html IDs`);
    return el as HTMLElement;
  }

  return {
    narrativeContent: req('narrative-content'),
    choiceArea:       req('choice-area'),
    chapterTitle:     req('chapter-title'),
    narrativePanel:   req('narrative-panel'),
    statusPanel:      req('status-panel'),
    menuBtn:          req('menu-btn'),
    menuPopover:      req('menu-popover'),
    menuItemStatus:   req('menu-item-status'),
    menuItemSave:     req('menu-item-save'),
    menuItemRestart:  req('menu-item-restart'),
    gameTitle:        req('game-title'),
    splashTitle:      document.querySelector('.splash-title') as HTMLElement,
    splashTagline:    req('splash-tagline'),
    splashOverlay:    req('splash-overlay'),
    splashNewBtn:     req('splash-new-btn'),
    splashLoadBtn:    req('splash-load-btn'),
    splashSlots:      req('splash-slots'),
    splashSlotsBack:  req('splash-slots-back'),
    saveOverlay:      req('save-overlay'),
    saveMenuClose:    req('save-menu-close'),
    charOverlay:      req('char-creation-overlay'),
    inputFirstName:   req('input-first-name')   as HTMLInputElement,
    inputLastName:    req('input-last-name')     as HTMLInputElement,
    counterFirst:     req('counter-first'),
    counterLast:      req('counter-last'),
    errorFirstName:   req('error-first-name'),
    errorLastName:    req('error-last-name'),
    charBeginBtn:     req('char-begin-btn')      as HTMLButtonElement,
    endingOverlay:    document.getElementById('ending-overlay'),
    endingTitle:      document.getElementById('ending-title'),
    endingContent:    document.getElementById('ending-content'),
    endingStats:      document.getElementById('ending-stats'),
    endingActionBtn:  document.getElementById('ending-action-btn'),
    storeOverlay:     document.getElementById('store-overlay'),
    toast:            req('toast'),
  };
}

// ---------------------------------------------------------------------------
// initThemeToggle — reads saved or OS preference, applies data-theme="light"
// on <html>, and wires the toggle button click handler.
// Call this as the first thing in boot() to avoid a FOUC on the JS-driven
// preference path (the inline <script> in <head> handles the true FOUC case).
// ---------------------------------------------------------------------------
export function initThemeToggle(): void {
  const btn  = document.getElementById('theme-toggle-btn') as HTMLButtonElement | null;
  const html = document.documentElement;

  function apply(theme: 'light' | 'dark'): void {
    if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
    if (btn) {
      btn.textContent = theme === 'light' ? '☀' : '☽';
      btn.title = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
    }
    localStorage.setItem('sa_theme', theme);
  }

  const saved  = localStorage.getItem('sa_theme') as 'light' | 'dark' | null;
  const osLight = window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false;
  apply(saved ?? (osLight ? 'light' : 'dark'));

  btn?.addEventListener('click', () => {
    apply(html.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });
}
