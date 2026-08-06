#!/usr/bin/env node
/**
 * §8.3 deliverable: a contrast matrix for every approved color-text
 * combination, generated FROM tokens.css so it can never drift out of sync
 * with a one-time manual audit. Run with `npm run contrast` (see
 * package.json) or `node scripts/contrast-matrix.mjs`.
 *
 * Exits non-zero if any REQUIRED pair fails its WCAG 2.2 AA threshold, so
 * this can also run as a CI gate (see ../.github/workflows/ci.yml) — a
 * design-token edit that breaks contrast fails the build instead of
 * shipping silently.
 *
 * Scope: the §8.1 module palette + the neutral/semantic tokens in
 * tokens.css's :root block — the "markazlashgan CSS o'zgaruvchilar... design
 * tokenlar" (§8.2) this section is about. Tailwind's separate brand/badge
 * utility palette (components/ui/Button.vue, Badge.vue) is a pre-existing,
 * un-unified second color system outside tokens.css and out of scope here.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tokensPath = path.join(__dirname, '..', 'src', 'tokens.css');
const outPath = path.join(__dirname, '..', 'CONTRAST-MATRIX.md');

// --- Parse :root { --name: #hex; ... } out of tokens.css ---

function parseTokens(css) {
  const rootMatch = css.match(/:root\s*{([^}]*)}/s);
  if (!rootMatch) throw new Error('Could not find a :root block in tokens.css');
  const tokens = new Map();
  const propPattern = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g;
  let m;
  while ((m = propPattern.exec(rootMatch[1])) !== null) {
    tokens.set(m[1], m[2].toLowerCase());
  }
  return tokens;
}

// --- WCAG 2.x relative luminance + contrast ratio ---

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

// --- Build the pairs to check (§8.2/§8.3 real usage, not every combination) ---

const NORMAL_TEXT_MIN = 4.5;
const LARGE_TEXT_MIN = 3.0; // headings / UI-component fills and outlines (§8.3)

function buildPairs(tokens) {
  const pairs = [];
  const surface = tokens.get('color-surface');
  const white = '#ffffff';

  for (let n = 0; n <= 5; n++) {
    const primary = tokens.get(`module-${n}`);
    const bg = tokens.get(`module-${n}-bg`);
    const accessible = tokens.get(`module-${n}-accessible`);
    if (!primary || !bg || !accessible) continue;

    pairs.push({
      group: `Module ${n}`,
      label: `module-${n}-accessible text on white surface`,
      fg: accessible,
      bg: surface,
      min: NORMAL_TEXT_MIN,
      usage: 'Body text set in the module color (headings, active nav, labels)',
      required: true,
    });
    pairs.push({
      group: `Module ${n}`,
      label: `module-${n}-accessible text on module-${n}-bg (light card)`,
      fg: accessible,
      bg,
      min: NORMAL_TEXT_MIN,
      usage: 'Info cards, definitions, key messages (§8.2 "och ranglar")',
      required: true,
    });
    pairs.push({
      group: `Module ${n}`,
      label: `module-${n} (saturated) as large text/heading on white`,
      fg: primary,
      bg: surface,
      min: LARGE_TEXT_MIN,
      usage: 'Large headings set directly in the saturated module color',
      required: true,
    });
    pairs.push({
      group: `Module ${n}`,
      label: `white text on module-${n} (saturated) button fill`,
      fg: white,
      bg: primary,
      min: NORMAL_TEXT_MIN,
      usage: '"Muhim tugmalar" (important buttons) — §8.3 explicitly warns ' +
        'against assuming white text is safe on every module color; this is ' +
        'the check that catches it',
      required: false, // informational: not every module color is required to host a solid white-text button
    });
    pairs.push({
      group: `Module ${n}`,
      label: `module-${n} (saturated) as a UI component fill/icon on white`,
      fg: primary,
      bg: surface,
      min: LARGE_TEXT_MIN,
      usage: 'Icon accents, progress fills, non-text UI components',
      required: true,
    });
  }

  const neutralPairs = [
    ['color-text', 'color-surface', NORMAL_TEXT_MIN, 'Default body text'],
    ['color-text', 'color-surface-alt', NORMAL_TEXT_MIN, 'Body text on the alt/page background'],
    ['color-text-muted', 'color-surface', NORMAL_TEXT_MIN, 'Captions, muted labels, timestamps'],
    ['color-error', 'color-surface', NORMAL_TEXT_MIN, 'Error messages (Alert.vue, form validation)'],
    ['color-success', 'color-surface', NORMAL_TEXT_MIN, 'Success messages (Alert.vue)'],
    ['color-focus', 'color-surface', LARGE_TEXT_MIN, 'Keyboard focus ring (non-text UI component)'],
  ];
  for (const [fgName, bgName, min, usage] of neutralPairs) {
    const fg = tokens.get(fgName);
    const bg = tokens.get(bgName);
    if (!fg || !bg) continue;
    pairs.push({ group: 'Neutral / semantic', label: `${fgName} on ${bgName}`, fg, bg, min, usage, required: true });
  }

  return pairs;
}

// --- Run ---

const css = readFileSync(tokensPath, 'utf8');
const tokens = parseTokens(css);
const pairs = buildPairs(tokens);

const results = pairs.map((p) => {
  const ratio = contrastRatio(p.fg, p.bg);
  return { ...p, ratio, passes: ratio >= p.min };
});

const failedRequired = results.filter((r) => r.required && !r.passes);

function fmtRatio(r) {
  return `${r.toFixed(2)}:1`;
}

let md = '# Contrast matrix (§8.3)\n\n';
md += `Generated by \`scripts/contrast-matrix.mjs\` from \`src/tokens.css\` — do not edit by hand, re-run the script instead.\n\n`;
md += `WCAG 2.2 AA thresholds: **${NORMAL_TEXT_MIN}:1** for normal text, **${LARGE_TEXT_MIN}:1** for large text / UI components.\n\n`;

let currentGroup = null;
for (const r of results) {
  if (r.group !== currentGroup) {
    currentGroup = r.group;
    md += `\n## ${currentGroup}\n\n`;
    md += '| Combination | Usage | Ratio | Required min | Result |\n';
    md += '|---|---|---|---|---|\n';
  }
  const status = r.passes ? '✅ pass' : r.required ? '❌ FAIL' : '⚠️ below threshold (informational)';
  md += `| ${r.label} (\`${r.fg}\` / \`${r.bg}\`) | ${r.usage} | ${fmtRatio(r.ratio)} | ${r.min}:1 | ${status} |\n`;
}

md += '\n---\n\n';
if (failedRequired.length === 0) {
  md += 'All required combinations pass.\n';
} else {
  md += `**${failedRequired.length} required combination(s) fail** and must be fixed before this can ship:\n\n`;
  for (const r of failedRequired) {
    md += `- ${r.group}: ${r.label} — ${fmtRatio(r.ratio)}, needs ${r.min}:1\n`;
  }
}

writeFileSync(outPath, md);

console.log(`Contrast matrix written to ${path.relative(process.cwd(), outPath)}`);
console.log(`${results.length} combinations checked, ${failedRequired.length} required failure(s).`);
for (const r of failedRequired) {
  console.error(`  FAIL: [${r.group}] ${r.label} — ${fmtRatio(r.ratio)} < ${r.min}:1`);
}

if (failedRequired.length > 0) {
  process.exitCode = 1;
}
