// systems/journal.js — Journal and achievements

import { playerState } from '../core/state.js';

// Current chapter — updated by the *title handler via setCurrentChapter().
// Entries before any *title fires are grouped under 'Prologue'.
let _currentChapter = 'Prologue';

export function setCurrentChapter(chapter: string): void {
  _currentChapter = chapter || 'Prologue';
}

export function getCurrentChapter(): string {
  return _currentChapter;
}

// addJournalEntry — unique=true skips insert if matching text+type exists.
// Returns true if inserted, false if deduplicated.
export function addJournalEntry(text: string, type = 'entry', unique = false): boolean {
  if (!Array.isArray(playerState.journal)) playerState.journal = [];
  const normalised = text.trim();
  if (unique && playerState.journal.some((e: { text: string; type: string }) => e.text === normalised && e.type === type)) {
    return false;
  }
  playerState.journal.push({ text: normalised, type, chapter: _currentChapter, timestamp: Date.now() });
  return true;
}

export function getJournalEntries(): Array<{ text: string; type: string; chapter?: string; timestamp: number }> {
  return Array.isArray(playerState.journal) ? playerState.journal : [];
}

export function getAchievements(): Array<{ text: string; type: string; chapter?: string; timestamp: number }> {
  return getJournalEntries().filter(e => e.type === 'achievement');
}
