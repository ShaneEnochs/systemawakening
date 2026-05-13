// systems/save-manager.ts — Save/load orchestration and UI wiring
//
// Extracted from engine.ts: contains all the button-event wiring for the
// save menu, splash screen, undo button, export/import, and save codes.
// Called once during boot with the fully-built dom object.

import type { Dom } from '../core/dom.js';

import {
  loadSaveFromSlot, saveGameToSlot,
  deleteSaveSlot, exportSaveSlot, importSaveFromJSON,
} from './saves.js';

import {
  hideSaveMenu, showSaveMenu, refreshAllSlotCards, loadAndResume,
  hideSplash, wireCharCreation, showCharacterCreation,
} from '../ui/overlays.js';

import { showToast } from '../ui/overlays.js';
import { getNarrativeLog } from '../ui/narrative.js';
import { runStatsScene } from '../ui/panels.js';
import { patchPlayerState } from '../core/state.js';

import { gotoScene } from '../core/interpreter.js';
import { popUndo, clearUndoStack, updateUndoBtn } from './undo.js';

// ---------------------------------------------------------------------------
// wireSaveUI — registers all save/load/undo/new-game event listeners.
// Must be called after all modules are initialised.
// ---------------------------------------------------------------------------
export function wireSaveUI(dom: Dom, opts: {
  scheduleStatsRender: () => void;
  setChapterTitle:     (t: string) => void;
}): void {
  const { scheduleStatsRender } = opts;

  // --- Menu popover ---
  const menuBtn     = dom.menuBtn;
  const menuPopover = dom.menuPopover;

  function openMenu(): void {
    menuPopover?.classList.remove('hidden');
    menuBtn?.setAttribute('aria-expanded', 'true');
  }
  function closeMenu(): void {
    menuPopover?.classList.add('hidden');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu(): void {
    if (menuPopover?.classList.contains('hidden')) openMenu();
    else closeMenu();
  }

  menuBtn?.addEventListener('click', e => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu on outside click
  document.addEventListener('click', e => {
    if (
      !menuPopover?.contains(e.target as Node) &&
      e.target !== menuBtn
    ) {
      closeMenu();
    }
  });

  // Close menu on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menuPopover?.classList.contains('hidden')) {
      closeMenu();
      menuBtn?.focus();
    }
  });

  // Menu item: Status
  dom.menuItemStatus?.addEventListener('click', () => {
    closeMenu();
    const visible = dom.statusPanel?.classList.toggle('status-visible');
    dom.statusPanel?.classList.toggle('status-hidden', !visible);
    scheduleStatsRender();
  });

  // Close status panel on outside click (excluding menu, store, the panel itself)
  document.addEventListener('click', e => {
    if (
      !dom.statusPanel?.contains(e.target as Node) &&
      !menuPopover?.contains(e.target as Node) &&
      e.target !== menuBtn &&
      !dom.storeOverlay?.contains(e.target as Node)
    ) {
      dom.statusPanel?.classList.remove('status-visible');
      dom.statusPanel?.classList.add('status-hidden');
    }
  });

  // Menu item: Save & Load
  dom.menuItemSave?.addEventListener('click', () => {
    closeMenu();
    showSaveMenu();
  });

  // Menu item: Restart
  dom.menuItemRestart?.addEventListener('click', () => {
    closeMenu();
    if (confirm('Return to the title screen? Manual saves will be kept.')) {
      hideSaveMenu();
      deleteSaveSlot('auto');
      location.reload();
    }
  });

  dom.saveMenuClose?.addEventListener('click', hideSaveMenu);
  dom.saveOverlay?.addEventListener('click', e => { if (e.target === dom.saveOverlay) hideSaveMenu(); });
  dom.saveOverlay?.addEventListener('keydown', (e: Event) => {
    if ((e as KeyboardEvent).key === 'Escape') hideSaveMenu();
  });

  // Keyboard shortcut: Ctrl+S / Cmd+S → toggle save menu
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (dom.saveOverlay.classList.contains('hidden')) {
        showSaveMenu();
      } else {
        hideSaveMenu();
      }
    }
    // Ctrl+Z / Cmd+Z → undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      const btn = document.getElementById('undo-btn') as HTMLButtonElement | null;
      if (btn && !btn.disabled) {
        e.preventDefault();
        popUndo();
      }
    }
  });

  // Save to slot
  [1, 2, 3].forEach(slot => {
    const btn = document.getElementById(`save-to-${slot}`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const existing = loadSaveFromSlot(slot);
      if (existing && !confirm(`Overwrite Slot ${slot}?`)) return;
      saveGameToSlot(slot, null, getNarrativeLog());
      hideSaveMenu();
      showToast(`Saved to Slot ${slot}`);
      refreshAllSlotCards();
    });
  });

  // Delete save slot (in-game menu)
  [1, 2, 3].forEach(slot => {
    const btn = document.getElementById(`save-delete-${slot}`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (confirm(`Delete Slot ${slot}? This cannot be undone.`)) {
        deleteSaveSlot(slot);
        refreshAllSlotCards();
      }
    });
  });

  // Load save slot (in-game menu)
  (['auto', 1, 2, 3] as Array<'auto'|1|2|3>).forEach(slot => {
    const btn = document.getElementById(`ingame-load-${slot}`);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const save = loadSaveFromSlot(slot);
      if (!save) return;
      hideSaveMenu();
      await loadAndResume(save);
    });
  });

  // New game — show character creation overlay, then run scene
  dom.splashNewBtn?.addEventListener('click', async () => {
    hideSplash();
    dom.menuBtn?.classList.remove('hidden');
    document.getElementById('undo-btn')?.classList.remove('hidden');
    clearUndoStack();
    await runStatsScene();

    const char = await showCharacterCreation();
    patchPlayerState({
      first_name:                 char.firstName,
      last_name:                  char.lastName,
      pronouns_subject:           char.pronouns_subject,
      pronouns_object:            char.pronouns_object,
      pronouns_possessive:        char.pronouns_possessive,
      pronouns_possessive_pronoun: char.pronouns_possessive_pronoun,
      pronouns_reflexive:         char.pronouns_reflexive,
      pronouns_label:             char.pronouns_label,
      pronouns_honorific:         char.pronouns_honorific,
      title:                      char.pronouns_label === 'she/her' ? 'Baroness' : 'Baron',
    });

    await gotoScene(char.startScene);
  });

  // Continue (splash load) — hide #splash-main, show save slots
  dom.splashLoadBtn?.addEventListener('click', () => {
    document.getElementById('splash-main')?.classList.add('hidden');
    dom.splashSlots?.classList.remove('hidden');
    refreshAllSlotCards();
  });

  // Back from save slots — show #splash-main, hide save slots
  dom.splashSlotsBack?.addEventListener('click', () => {
    dom.splashSlots?.classList.add('hidden');
    document.getElementById('splash-main')?.classList.remove('hidden');
  });

  // Load from splash slots
  (['auto', 1, 2, 3] as Array<'auto'|1|2|3>).forEach(slot => {
    const btn = document.getElementById(`slot-load-${slot}`);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const save = loadSaveFromSlot(slot);
      if (!save) return;
      hideSplash();
      await loadAndResume(save);
    });
  });

  // Delete from splash slots
  (['auto', 1, 2, 3] as Array<'auto'|1|2|3>).forEach(slot => {
    const btn = document.getElementById(`slot-delete-${slot}`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const label = slot === 'auto' ? 'the auto-save' : `Slot ${slot}`;
      if (confirm(`Delete ${label}? This cannot be undone.`)) {
        deleteSaveSlot(slot);
        refreshAllSlotCards();
      }
    });
  });

  wireCharCreation();

  // Undo button
  const undoBtn = document.getElementById('undo-btn');
  if (undoBtn) undoBtn.addEventListener('click', popUndo);
  updateUndoBtn();

  // Export save slots
  [1, 2, 3].forEach(slot => {
    const btn = document.getElementById(`save-export-${slot}`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!exportSaveSlot(slot)) showToast(`Slot ${slot} is empty.`);
      else showToast(`Slot ${slot} exported.`);
    });
  });

  // Import save file
  const importInput = document.getElementById('save-import-file') as HTMLInputElement | null;
  if (importInput) {
    importInput.addEventListener('change', async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      const slotEl = document.getElementById('save-import-slot') as HTMLSelectElement | null;
      const targetSlot = Number(slotEl?.value || 1);
      try {
        const text   = await file.text();
        const json   = JSON.parse(text);
        const result = importSaveFromJSON(json, targetSlot);
        if (result.ok) {
          showToast(`Imported to Slot ${targetSlot}.`);
          refreshAllSlotCards();
        } else {
          showToast(`Import failed: ${(result as { ok: false; reason: string }).reason}`);
        }
      } catch {
        showToast('Import failed: file could not be parsed as JSON.');
      }
      importInput.value = '';
    });
  }

}
