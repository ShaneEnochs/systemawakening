// ui/tooltip.ts — JS-driven lore-term tooltip (desktop hover + mobile tap/sheet)
//
// Replaces the CSS-only ::after tooltip so that mobile taps also work.
// On narrow viewports (≤768px) the tooltip appears as a bottom sheet.
// Event delegation on narrativeContent keeps listener count at 2.

let _tooltip:  HTMLElement | null = null;
let _backdrop: HTMLElement | null = null;
let _activeTerm: HTMLElement | null = null;

// ---------------------------------------------------------------------------
// createTooltipDom — builds the shared tooltip and backdrop elements once.
// ---------------------------------------------------------------------------
function createTooltipDom(): void {
  _tooltip = document.createElement('div');
  _tooltip.id        = 'lore-tooltip';
  _tooltip.className = 'lore-tooltip';
  _tooltip.setAttribute('role', 'tooltip');
  _tooltip.setAttribute('aria-live', 'polite');
  document.body.appendChild(_tooltip);

  _backdrop = document.createElement('div');
  _backdrop.className = 'lore-tooltip-backdrop';
  _backdrop.addEventListener('click', hideTooltip);
  document.body.appendChild(_backdrop);
}

// ---------------------------------------------------------------------------
// showTooltip — populates and positions the tooltip.
// ---------------------------------------------------------------------------
function showTooltip(term: HTMLElement): void {
  if (!_tooltip) return;

  const text        = term.textContent ?? '';
  const description = term.dataset.tooltip ?? '';
  const isSheet     = window.innerWidth <= 768;

  _tooltip.innerHTML =
    `<span class="lore-tooltip-term">${escapeHtml(text)}</span>` +
    `<span class="lore-tooltip-desc">${escapeHtml(description)}</span>`;

  _tooltip.classList.toggle('lore-tooltip--sheet', isSheet);
  _tooltip.classList.add('lore-tooltip--visible');

  if (isSheet) {
    if (_backdrop) _backdrop.classList.add('lore-tooltip-backdrop--visible');
  } else {
    positionAboveTerm(term);
  }

  _activeTerm = term;
}

// ---------------------------------------------------------------------------
// positionAboveTerm — positions the tooltip above the hovered element.
// Flips to below if the term is near the top of the viewport.
// ---------------------------------------------------------------------------
function positionAboveTerm(term: HTMLElement): void {
  if (!_tooltip) return;
  const rect    = term.getBoundingClientRect();
  const ttWidth = Math.min(260, window.innerWidth - 20);

  _tooltip.style.width    = `${ttWidth}px`;
  _tooltip.style.maxWidth = `${ttWidth}px`;

  // Tentative position: centred above the term
  let left = rect.left + rect.width / 2 - ttWidth / 2;
  // Clamp horizontally within viewport
  left = Math.max(8, Math.min(left, window.innerWidth - ttWidth - 8));
  _tooltip.style.left = `${left + window.scrollX}px`;

  // Measure tooltip height to decide above vs below
  _tooltip.style.top = '-9999px';
  const ttHeight = _tooltip.offsetHeight || 80;

  const spaceAbove = rect.top;
  const topPos = spaceAbove >= ttHeight + 8
    ? rect.top + window.scrollY - ttHeight - 8
    : rect.bottom + window.scrollY + 8;

  _tooltip.style.top = `${topPos}px`;
}

// ---------------------------------------------------------------------------
// hideTooltip
// ---------------------------------------------------------------------------
function hideTooltip(): void {
  if (!_tooltip) return;
  _tooltip.classList.remove('lore-tooltip--visible');
  if (_backdrop) _backdrop.classList.remove('lore-tooltip-backdrop--visible');
  _activeTerm = null;
}

// ---------------------------------------------------------------------------
// escapeHtml — local copy so this module has no circular import
// ---------------------------------------------------------------------------
function escapeHtml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// initTooltip — called from engine.ts at boot.
// ---------------------------------------------------------------------------
export function initTooltip(narrativeContent: HTMLElement): void {
  createTooltipDom();

  // ── Desktop: hover ──────────────────────────────────────────────────────
  narrativeContent.addEventListener('mouseenter', (e) => {
    const term = (e.target as HTMLElement).closest<HTMLElement>('.lore-term');
    if (!term) return;
    showTooltip(term);
  }, true);

  narrativeContent.addEventListener('mouseleave', (e) => {
    const term = (e.target as HTMLElement).closest<HTMLElement>('.lore-term');
    if (!term) return;
    // Only hide if the relatedTarget is not still inside the tooltip
    hideTooltip();
  }, true);

  // ── Mobile / keyboard: tap or click ────────────────────────────────────
  // Use capture so we can stop propagation before the document dismiss handler.
  narrativeContent.addEventListener('click', (e) => {
    const term = (e.target as HTMLElement).closest<HTMLElement>('.lore-term');
    if (!term) return;
    e.stopPropagation();
    if (_activeTerm === term && _tooltip?.classList.contains('lore-tooltip--visible')) {
      hideTooltip();
    } else {
      showTooltip(term);
    }
  });

  // Keyboard: Enter or Space on a focused .lore-term
  narrativeContent.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const term = (e.target as HTMLElement).closest<HTMLElement>('.lore-term');
    if (!term) return;
    e.preventDefault();
    e.stopPropagation();
    if (_activeTerm === term && _tooltip?.classList.contains('lore-tooltip--visible')) {
      hideTooltip();
    } else {
      showTooltip(term);
    }
  });

  // ── Global dismiss on click outside ────────────────────────────────────
  document.addEventListener('click', () => { hideTooltip(); });

  // ── Reposition on scroll / resize ──────────────────────────────────────
  window.addEventListener('resize', () => {
    if (_activeTerm && _tooltip?.classList.contains('lore-tooltip--visible')) {
      showTooltip(_activeTerm);
    }
  }, { passive: true });
}
