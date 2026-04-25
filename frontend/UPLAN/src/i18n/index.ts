import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en";
import { translateInlineText } from "./inlineText";

const supportedLanguages = ["en", "fr", "es", "it"] as const;
type SupportedLanguage = (typeof supportedLanguages)[number];

function getSavedLanguage(): SupportedLanguage {
  const saved = localStorage.getItem("appLanguage")?.slice(0, 2);
  return supportedLanguages.includes(saved as SupportedLanguage)
    ? (saved as SupportedLanguage)
    : "en";
}

const savedLanguage = getSavedLanguage();
const loadedLanguages = new Set<SupportedLanguage>(["en"]);

function deepMerge<T extends Record<string, any>>(base: T, override: Record<string, any>): T {
  const output: Record<string, any> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      output[key] &&
      typeof output[key] === "object" &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  }

  return output as T;
}

function withVisibleFallback<T>(fallback: T, candidate: any, language: SupportedLanguage = "en"): T {
  if (typeof fallback === "string") {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      if (language !== "en" && candidate === fallback) {
        const inlineTranslation = translateInlineText(language, fallback);
        return (inlineTranslation !== fallback ? inlineTranslation : candidate) as T;
      }
      return candidate as T;
    }
    return fallback;
  }

  if (Array.isArray(fallback)) {
    return Array.isArray(candidate) && candidate.length > 0 ? candidate : fallback;
  }

  if (fallback && typeof fallback === "object") {
    const output: Record<string, any> = {};
    const fallbackRecord = fallback as Record<string, any>;
    const candidateRecord =
      candidate && typeof candidate === "object" && !Array.isArray(candidate)
        ? (candidate as Record<string, any>)
        : {};

    for (const key of Object.keys(fallbackRecord)) {
      output[key] = withVisibleFallback(fallbackRecord[key], candidateRecord[key], language);
    }

    for (const [key, value] of Object.entries(candidateRecord)) {
      if (!(key in output)) output[key] = value;
    }

    return output as T;
  }

  return candidate ?? fallback;
}

async function getLocale(language: SupportedLanguage) {
  if (language === "en") return en;
  if (language === "fr") return (await import("./locales/fr")).default;
  if (language === "es") {
    const [{ default: es }, { default: spanishOverrides }] = await Promise.all([
      import("./locales/es"),
      import("./spanishOverrides"),
    ]);
    return deepMerge(es, spanishOverrides);
  }
  return (await import("./locales/it")).default;
}

export async function loadLanguageResources(language: SupportedLanguage) {
  if (loadedLanguages.has(language)) return;

  const locale = await getLocale(language);
  const resource = language === "en" ? locale : withVisibleFallback(en, locale, language);
  i18n.addResourceBundle(language, "translation", resource, true, true);
  loadedLanguages.add(language);
}

document.documentElement.lang = savedLanguage;

export const i18nReady = (async () => {
  const initialLocale = await getLocale(savedLanguage);
  const initialTranslation =
    savedLanguage === "en" ? initialLocale : withVisibleFallback(en, initialLocale, savedLanguage);
  loadedLanguages.add(savedLanguage);

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ...(savedLanguage !== "en"
        ? { [savedLanguage]: { translation: initialTranslation } }
        : {}),
    },
    lng: savedLanguage,
    fallbackLng: "en",
    supportedLngs: supportedLanguages,
    nonExplicitSupportedLngs: true,
    cleanCode: true,
    load: "languageOnly",
    returnEmptyString: false,
    returnNull: false,
    parseMissingKeyHandler: (key) =>
      translateInlineText(i18n.resolvedLanguage || i18n.language || savedLanguage, key),
    interpolation: {
      escapeValue: false,
    },
  });
})();

export default i18n;
