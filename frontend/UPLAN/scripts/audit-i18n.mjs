import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const localesDir = path.join(root, "src", "i18n", "locales");
const files = ["en", "fr", "es", "it"];

function loadLocale(lang) {
  const file = path.join(localesDir, `${lang}.ts`);
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/const\s+\w+\s*=\s*([\s\S]*?);\s*export\s+default\s+\w+\s*;/);
  if (!match) throw new Error(`Could not parse ${file}`);
  return vm.runInNewContext(`(${match[1]})`, {}, { filename: file });
}

function flatten(value, prefix = "", out = {}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
  }
  out[prefix] = value;
  return out;
}

function findMojibake(value, prefix = "", out = []) {
  if (typeof value === "string") {
    if (/Ã|â[€œ€�€™†€¢€”]|�/.test(value)) out.push([prefix, value]);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => findMojibake(child, `${prefix}.${index}`, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      findMojibake(child, prefix ? `${prefix}.${key}` : key, out);
    }
  }
  return out;
}

const loaded = Object.fromEntries(files.map((lang) => [lang, loadLocale(lang)]));
const baseKeys = new Set(Object.keys(flatten(loaded.en)));
const baseFlat = flatten(loaded.en);

let hasIssue = false;
for (const lang of files) {
  const flat = flatten(loaded[lang]);
  const keys = new Set(Object.keys(flat));
  const missing = [...baseKeys].filter((key) => !keys.has(key));
  const extra = [...keys].filter((key) => !baseKeys.has(key));
  const mojibake = findMojibake(loaded[lang]);
  const sameAsEnglish =
    lang === "en"
      ? []
      : [...baseKeys].filter((key) => {
          const value = flat[key];
          const fallback = baseFlat[key];
          return (
            typeof fallback === "string" &&
            typeof value === "string" &&
            value === fallback &&
            fallback.trim().length > 2 &&
            !/^[\d\s:.,%(){}|/+-]+$/.test(fallback)
          );
        });

  console.log(
    `${lang}: ${keys.size} keys, ${missing.length} missing, ${extra.length} extra, ${mojibake.length} mojibake strings, ${sameAsEnglish.length} English fallback strings`,
  );
  if (missing.length || mojibake.length) hasIssue = true;
  if (missing.length) console.log(`  missing: ${missing.slice(0, 20).join(", ")}`);
  if (extra.length) console.log(`  extra: ${extra.slice(0, 20).join(", ")}`);
  if (mojibake.length) console.log(`  mojibake: ${mojibake.slice(0, 20).map(([key]) => key).join(", ")}`);
  if (sameAsEnglish.length) console.log(`  same as English: ${sameAsEnglish.slice(0, 40).join(", ")}`);
}

process.exitCode = hasIssue ? 1 : 0;
