Harmonize translations tool

This script helps keep translation files under `src/Translations/` synchronized by ensuring every language block contains the same set of keys (the union of all keys found in the translation files).

Usage:

From the project root (where package.json is):

```bash
node tools/harmonize-translations.js    # prints proposed changes
node tools/harmonize-translations.js --apply   # applies changes (backups created: *.bak)
```

Notes and safety:
- The script is conservative: it only inserts missing keys into language blocks.
- It uses any available EN value in the same file as a fallback. If not present, it searches EN definitions across all translation files. If no EN fallback is found, it inserts an empty string with a `// TODO: add translation` comment.
- Backups are created for every modified file with `.bak` extension.
- The script performs textual edits; please run your normal tests / `npx tsc --noEmit` after applying changes.

If you want, I can run the script with `--apply` now (I will create backups). Proceed? (Say yes to apply.)