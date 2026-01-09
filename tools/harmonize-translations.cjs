#!/usr/bin/env node
// tools/harmonize-translations.cjs
// CommonJS version for projects with "type": "module"

const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, '..', 'src', 'Translations');
const APPLY = process.argv.includes('--apply');

function listFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js'))
              .map(f => path.join(dir, f));
}

function findLangBlocks(content) {
  const blocks = []; // {lang, start, end, text}
  const langRegex = /^\s*([A-Z]{2,3}|US|CA):\s*\{/mg;
  let m;
  while ((m = langRegex.exec(content)) !== null) {
    const lang = m[1];
    const startIndex = m.index + m[0].length - 1; // position of '{'
    // find matching '}' by scanning
    let depth = 1;
    let i = startIndex + 1;
    for (; i < content.length; i++) {
      const ch = content[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) break;
    }
    if (depth === 0) {
      blocks.push({ lang, start: m.index, objStart: startIndex, end: i, text: content.substring(startIndex+1, i) });
    } else {
      console.warn('Failed to find end for lang', lang);
    }
  }
  return blocks;
}

function extractKeysAndValues(blockText) {
  const keys = new Set();
  const kv = {}; // key -> string value (raw with quotes)
  // match lines like: key: "value",
  const regex = /(^\s*([A-Za-z0-9_]+)\s*:\s*)(["'`])([\s\S]*?)\3\s*,?/mg;
  let m;
  while ((m = regex.exec(blockText)) !== null) {
    const key = m[2];
    const quote = m[3];
    const val = m[4];
    keys.add(key);
    kv[key] = quote + val.replace(/\r?\n/g, '\\n') + quote; // store quoted value
  }
  // also catch keys with non-string values (booleans/numbers) - optional
  const regexSimple = /(^\s*([A-Za-z0-9_]+)\s*:\s*)([^"'`\n][^,\n\r]*)/mg;
  while ((m = regexSimple.exec(blockText)) !== null) {
    const key = m[2];
    if (!kv[key]) {
      const raw = m[3].trim();
      // ignore object starts
      if (!raw.startsWith('{') && !raw.startsWith('[')) {
        keys.add(key);
        kv[key] = raw.replace(/\r?\n/g, '');
      }
    }
  }
  return { keys: Array.from(keys), kv };
}

function computeUnion(files) {
  const union = new Set();
  const fileLangMap = {}; // file -> { lang -> {keys, kv} }

  files.forEach(fp => {
    const content = fs.readFileSync(fp, 'utf8');
    const blocks = findLangBlocks(content);
    fileLangMap[fp] = {};
    blocks.forEach(b => {
      const { keys, kv } = extractKeysAndValues(b.text);
      keys.forEach(k => union.add(k));
      fileLangMap[fp][b.lang] = { keys, kv, start: b.objStart, end: b.end };
    });
  });

  return { union: Array.from(union).sort(), fileLangMap };
}

function proposeAndApply(files, unionData) {
  const { union, fileLangMap } = unionData;
  const changes = [];

  files.forEach(fp => {
    let content = fs.readFileSync(fp, 'utf8');
    const langBlocks = fileLangMap[fp];
    if (!langBlocks) return;
    // find EN kv for fallback in this file
    const enKv = (langBlocks.EN && langBlocks.EN.kv) || {};
    const globalEnKv = {}; // collect EN across all files
    // collect global EN values from other files
    Object.keys(fileLangMap).forEach(otherFp => {
      const kv = fileLangMap[otherFp].EN && fileLangMap[otherFp].EN.kv;
      if (kv) Object.assign(globalEnKv, kv);
    });

    let fileChanged = false;
    const insertions = [];

    // for each language block in this file
    const langOrder = Object.keys(langBlocks);
    langOrder.forEach(lang => {
      const block = langBlocks[lang];
      const present = new Set(block.keys);
      const missing = union.filter(k => !present.has(k));
      if (missing.length === 0) return;
      fileChanged = true;
      // build insertion text
      const lines = missing.map(k => {
        // pick fallback value: first from this file's EN, then globalEnKv, else empty string with TODO
        const fallback = enKv[k] || globalEnKv[k] || '""';
        const comment = fallback === '""' ? ' // TODO: add translation' : '';
        return `    ${k}: ${fallback},${comment}`;
      }).join('\n') + '\n';

      // compute insertion index: place before the closing '}' of the block
      const insertAt = block.end; // index of closing brace
      insertions.push({ insertAt, text: lines });
    });

    if (fileChanged) {
      // apply insertions in reverse order (so indexes remain valid)
      insertions.sort((a,b)=>b.insertAt-a.insertAt);
      insertions.forEach(ins => {
        content = content.slice(0, ins.insertAt) + '\n' + ins.text + content.slice(ins.insertAt);
      });
      changes.push({ file: fp, missingCount: insertions.reduce((s,i)=>s + i.text.split('\n').filter(Boolean).length,0) });
      if (APPLY) {
        // backup
        fs.copyFileSync(fp, fp + '.bak');
        fs.writeFileSync(fp, content, 'utf8');
      }
    }
  });

  return changes;
}

function main() {
  const files = listFiles(translationsDir);
  console.log('Found', files.length, 'translation files.');
  const unionData = computeUnion(files);
  console.log('Union keys count:', unionData.union.length);
  if (!APPLY) console.log('Run with --apply to write changes.');
  const changes = proposeAndApply(files, unionData);
  if (changes.length === 0) console.log('No missing keys found.');
  else {
    console.log('Files updated (or would be updated):');
    changes.forEach(c => console.log('-', c.file, c.missingCount, 'keys added'));
  }
}

main();
