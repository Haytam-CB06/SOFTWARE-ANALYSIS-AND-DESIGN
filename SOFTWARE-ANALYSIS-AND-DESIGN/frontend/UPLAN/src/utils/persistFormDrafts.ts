// Lightweight, app-wide form draft persistence.
// Keeps partial inputs across refreshes for all forms (except passwords).
// Designed to be safe: no UI changes, no breaking.

const STORAGE_PREFIX = 'formDraft:';

type DraftableEl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

type ContextKeyGetter = () => string;

function isDraftable(el: any): el is DraftableEl {
  if (!el) return false;
  const tag = String(el.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

function getElKey(el: DraftableEl, contextKey: string): string | null {
  const name = (el.getAttribute('name') || '').trim();
  const id = (el.getAttribute('id') || '').trim();
  const field = name || id;
  if (!field) return null;

  const formId = (el.form?.getAttribute('id') || el.form?.getAttribute('name') || '').trim() || 'form';
  return `${STORAGE_PREFIX}${contextKey}:${formId}:${field}`;
}

function saveDraft(el: DraftableEl, contextKey: string) {
  if (el instanceof HTMLInputElement && el.type === 'password') return;
  const key = getElKey(el, contextKey);
  if (!key) return;

  try {
    if (el instanceof HTMLInputElement) {
      const type = (el.type || 'text').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        sessionStorage.setItem(key, el.checked ? '1' : '0');
      } else {
        sessionStorage.setItem(key, el.value);
      }
    } else if (el instanceof HTMLSelectElement) {
      if (el.multiple) {
        const values = Array.from(el.selectedOptions).map((o) => o.value);
        sessionStorage.setItem(key, JSON.stringify(values));
      } else {
        sessionStorage.setItem(key, el.value);
      }
    } else {
      sessionStorage.setItem(key, el.value);
    }
  } catch {
    // ignore storage failures
  }
}

function restoreDraft(el: DraftableEl, contextKey: string) {
  if (el instanceof HTMLInputElement && el.type === 'password') return;
  const key = getElKey(el, contextKey);
  if (!key) return;

  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(key);
  } catch {
    stored = null;
  }
  if (stored === null) return;

  try {
    if (el instanceof HTMLInputElement) {
      const type = (el.type || 'text').toLowerCase();
      if (type === 'checkbox' || type === 'radio') {
        el.checked = stored === '1';
      } else {
        if (el.value !== stored) el.value = stored;
      }
    } else if (el instanceof HTMLSelectElement) {
      if (el.multiple) {
        const values = JSON.parse(stored);
        if (Array.isArray(values)) {
          Array.from(el.options).forEach((opt) => {
            opt.selected = values.includes(opt.value);
          });
        }
      } else {
        el.value = stored;
      }
    } else {
      if (el.value !== stored) el.value = stored;
    }

    // Notify frameworks/listeners.
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } catch {
    // ignore invalid stored values
  }
}

function restoreAll(contextKey: string, root: ParentNode = document) {
  const els = root.querySelectorAll('input, textarea, select');
  els.forEach((node) => {
    if (isDraftable(node)) restoreDraft(node as DraftableEl, contextKey);
  });
}

function clearFormDrafts(form: HTMLFormElement, contextKey: string) {
  const formId = (form.getAttribute('id') || form.getAttribute('name') || '').trim() || 'form';
  const prefix = `${STORAGE_PREFIX}${contextKey}:${formId}:`;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export function setupFormDraftPersistence(getContextKey: ContextKeyGetter) {
  const initialRestore = () => restoreAll(getContextKey());
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initialRestore, { once: true });
  } else {
    // wait one tick so first render mounts inputs
    setTimeout(initialRestore, 0);
  }

  const onInput = (e: Event) => {
    const t = e.target as any;
    if (!isDraftable(t)) return;
    saveDraft(t, getContextKey());
  };

  const onSubmit = (e: Event) => {
    const t = e.target as any;
    if (t && t.tagName && String(t.tagName).toLowerCase() === 'form') {
      clearFormDrafts(t as HTMLFormElement, getContextKey());
    }
  };

  document.addEventListener('input', onInput, true);
  document.addEventListener('change', onInput, true);
  document.addEventListener('submit', onSubmit, true);

  const observer = new MutationObserver((mutations) => {
    const contextKey = getContextKey();
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches?.('input, textarea, select')) {
          restoreDraft(node as any, contextKey);
        }
        node.querySelectorAll?.('input, textarea, select')?.forEach((el) => {
          restoreDraft(el as any, contextKey);
        });
      });
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  return () => {
    document.removeEventListener('input', onInput, true);
    document.removeEventListener('change', onInput, true);
    document.removeEventListener('submit', onSubmit, true);
    observer.disconnect();
  };
}
