/**
 * Content script: finds ServiceNow journal textareas and replaces them with a rich text editor.
 * Handles dynamic updates via MutationObserver and nested frames.
 */
/**
 * @fileoverview Content script entrypoint. Attaches the rich text editor to ServiceNow
 * journal textareas, keeps the original textarea in sync by firing input/change events,
 * and observes dynamic DOM changes to attach editors to newly added fields.
 */
(function () {
  const log = (...a) => window.snjrteLogger?.info('[content]', ...a);
  const debug = (...a) => window.snjrteLogger?.debug('[content]', ...a);
  const ERR = (...a) => window.snjrteLogger?.error('[content]', ...a);

  /** Tracks processed textareas to prevent double-initialization. */
  const processed = new WeakSet();

  /**
   * Determine if a textarea is a ServiceNow journal field by id/name/attrs.
   * @param {HTMLTextAreaElement} ta
   * @returns {boolean}
   */
  function isJournalTextarea(ta) {
    const id = (ta.id || '').toLowerCase();
    const name = (ta.getAttribute('name') || '').toLowerCase();
    const streamAttr = ta.getAttribute('data-stream-text-input') || '';
    return (
      ta.matches('textarea.sn-string-textarea') &&
      (id.includes('activity-stream') || streamAttr.length > 0 || /work_notes|comments/.test(id + ' ' + name + ' ' + streamAttr))
    );
  }

  /**
   * Process a textarea if it is a journal field.
   * @param {HTMLTextAreaElement} ta
   */
  function processTextarea(ta) {
    if (processed.has(ta)) return;
    if (!isJournalTextarea(ta)) return;

    try {
      processed.add(ta);
      window.snjrteEditor?.attachEditor(ta, { placeholder: ta.placeholder || 'Add notes...', onChange: () => {} });
    } catch (e) {
      ERR('Failed to attach editor', e);
    }
  }

  /** Scan the DOM now for candidate textareas. */
  function scan() {
    /** @type {NodeListOf<HTMLTextAreaElement>} */
    const candidates = document.querySelectorAll('textarea.sn-string-textarea');
    candidates.forEach(processTextarea);
  }

  /** Observe mutations to catch dynamic field rendering. */
  function observe() {
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes && r.addedNodes.forEach(n => {
          if (!(n instanceof HTMLElement)) return;
          if (n.matches && n.matches('textarea.sn-string-textarea')) processTextarea(/** @type {HTMLTextAreaElement} */(n));
          n.querySelectorAll && n.querySelectorAll('textarea.sn-string-textarea').forEach(el => processTextarea(/** @type {HTMLTextAreaElement} */(el)));
        });
      }
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
  }

  /** Initialize the content script in current document/frame. */
  function init() {
    try {
      debug('Init content script at', location.href);
      scan();
      observe();
    } catch (e) {
      ERR('Init error', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
