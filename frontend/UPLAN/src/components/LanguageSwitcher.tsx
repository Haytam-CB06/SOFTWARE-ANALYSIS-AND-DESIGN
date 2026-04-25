import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useInlineText } from "../i18n/inlineText";

type Lang = "en" | "fr" | "es" | "it";
const supportedLanguages: Lang[] = ["en", "fr", "es", "it"];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const tt = useInlineText();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const languages: { code: Lang; label: string }[] = [
    { code: "en", label: "English" },
    { code: "fr", label: "Francais" },
    { code: "es", label: "Espanol" },
    { code: "it", label: "Italiano" },
  ];

  const currentLangValue = i18n.resolvedLanguage || i18n.language || "en";
  const currentLangSlice = currentLangValue.slice(0, 2) as Lang;
  const currentLang = supportedLanguages.includes(currentLangSlice) ? currentLangSlice : "en";

  const changeLanguage = (lang: Lang) => {
    if (lang === currentLang || isChanging) {
      setOpen(false);
      return;
    }

    setIsChanging(true);
    setOpen(false);
    localStorage.setItem("appLanguage", lang);
    document.documentElement.lang = lang;
    i18n.changeLanguage(lang);

    const notifyLanguageRefresh = () => {
      window.dispatchEvent(
        new CustomEvent("uplan:language-refresh", {
          detail: { language: lang },
        }),
      );
    };

    notifyLanguageRefresh();
    window.location.reload();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const dropdownWidth = 220;
      const gap = 10;
      const viewportPadding = 12;

      let left = rect.right - dropdownWidth;
      if (left < viewportPadding) left = viewportPadding;
      if (left + dropdownWidth > window.innerWidth - viewportPadding) {
        left = window.innerWidth - dropdownWidth - viewportPadding;
      }

      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + gap,
        left,
        width: dropdownWidth,
        zIndex: 999999,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        !(target instanceof Element && target.closest("[data-language-dropdown='true']"))
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const dropdown = mounted
    ? createPortal(
        <div
          data-language-dropdown="true"
          style={dropdownStyle}
          className={`origin-top-right rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-all duration-200 dark:border-slate-700/80 dark:bg-slate-900/95 ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
              : "pointer-events-none -translate-y-1 opacity-0 scale-95"
          }`}
        >
          <div className="mb-1 px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {tt('Language')}
          </div>

          <div className="space-y-1">
            {languages.map((lang) => {
              const active = currentLang === lang.code;

              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  disabled={isChanging}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition-all duration-200 ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {lang.code}
                    </span>
                    <span className="font-medium">{tt(lang.label)}</span>
                  </div>

                  {active ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-white dark:bg-blue-500">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <button
          ref={buttonRef}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={`flex items-center gap-2 rounded-2xl border border-white/20 bg-black px-3.5 py-2.5 text-white backdrop-blur-md transition-all duration-300 hover:bg-black hover:shadow-lg active:scale-[0.98] ${
            open ? "ring-2 ring-white/20" : ""
          }`}
        >
          <Globe className="h-4 w-4 text-blue-200" />
          <span className="text-sm font-semibold uppercase tracking-wide">
            {currentLang}
          </span>
        </button>
      </div>

      {dropdown}
    </>
  );
}
