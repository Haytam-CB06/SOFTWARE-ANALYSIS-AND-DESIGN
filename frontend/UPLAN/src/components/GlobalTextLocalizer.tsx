import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCanonicalInlineText, translateInlineText } from '../i18n/inlineText';

const textNodeOriginals = new WeakMap<Text, string>();
const attributeOriginals = new WeakMap<Element, Map<string, string>>();

const TRANSLATABLE_ATTRIBUTES = ['aria-label', 'title', 'placeholder', 'alt'];
const LANGUAGE_REFRESH_EVENT = 'uplan:language-refresh';

function shouldSkipNode(node: Node) {
  const parent = node.parentElement;
  if (!parent) return true;

  return Boolean(
    parent.closest(
      'script, style, code, pre, textarea, input, [data-no-localize="true"], [data-language-dropdown="true"]',
    ),
  );
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function localizeTextNode(node: Text, language: string) {
  if (shouldSkipNode(node)) return;

  const current = node.nodeValue ?? '';
  if (!current.trim()) return;

  const original = getCanonicalInlineText(textNodeOriginals.get(node) ?? current);
  textNodeOriginals.set(node, original);

  const leading = current.match(/^\s*/)?.[0] ?? '';
  const trailing = current.match(/\s*$/)?.[0] ?? '';
  const source = normalizeText(original);
  if (!source) return;

  const translated = translateInlineText(language, source);
  const nextValue = `${leading}${translated}${trailing}`;
  if ((translated !== source || current !== original) && current !== nextValue) {
    node.nodeValue = nextValue;
  }
}

function localizeAttributes(element: Element, language: string) {
  if (element.closest('[data-no-localize="true"], [data-language-dropdown="true"]')) return;

  let originals = attributeOriginals.get(element);
  if (!originals) {
    originals = new Map();
    attributeOriginals.set(element, originals);
  }

  for (const attr of TRANSLATABLE_ATTRIBUTES) {
    const current = element.getAttribute(attr);
    if (!current?.trim()) continue;

    const original = getCanonicalInlineText(originals.get(attr) ?? current);
    originals.set(attr, original);

    const source = normalizeText(original);
    const translated = translateInlineText(language, source);
    if ((translated !== source || current !== original) && current !== translated) {
      element.setAttribute(attr, translated);
    }
  }
}

function localizeTree(root: ParentNode, language: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

  while (current) {
    localizeTextNode(current as Text, language);
    current = walker.nextNode();
  }

  if (root instanceof Element) {
    localizeAttributes(root, language);
  }

  root.querySelectorAll?.('*').forEach((element) => localizeAttributes(element, language));
}

function getLanguageFromEvent(event: Event, fallback: string) {
  const detail = (event as CustomEvent<{ language?: string }>).detail;
  return detail?.language || fallback;
}

export default function GlobalTextLocalizer() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const run = (targetLanguage = language) => localizeTree(document.body, targetLanguage);
    const frame = window.requestAnimationFrame(() => run());
    const timers: number[] = [];

    const scheduleRun = (targetLanguage = language) => {
      window.requestAnimationFrame(() => run(targetLanguage));
      timers.push(window.setTimeout(() => run(targetLanguage), 50));
      timers.push(window.setTimeout(() => run(targetLanguage), 175));
    };

    const handleLanguageRefresh = (event: Event) => {
      scheduleRun(getLanguageFromEvent(event, language));
    };

    const observer = new MutationObserver((mutations) => {
      window.requestAnimationFrame(() => {
        for (const mutation of mutations) {
          if (mutation.type === 'characterData' && mutation.target instanceof Text) {
            localizeTextNode(mutation.target, language);
            continue;
          }

          if (mutation.type === 'attributes' && mutation.target instanceof Element) {
            localizeAttributes(mutation.target, language);
            continue;
          }

          mutation.addedNodes.forEach((node) => {
            if (node instanceof Text) {
              localizeTextNode(node, language);
            } else if (node instanceof Element) {
              localizeTree(node, language);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
    });
    window.addEventListener(LANGUAGE_REFRESH_EVENT, handleLanguageRefresh);
    i18n.on('languageChanged', scheduleRun);

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener(LANGUAGE_REFRESH_EVENT, handleLanguageRefresh);
      i18n.off('languageChanged', scheduleRun);
      observer.disconnect();
    };
  }, [i18n, language]);

  return null;
}
