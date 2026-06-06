// Imports the open-source, MIT-licensed Funko catalogue
// (https://github.com/kennymkchan/funko-pop-data) into the funko_items table.
//
// We use this dataset instead of scraping funko.com or hobbydb.com: both of
// those actively block bots (Cloudflare / human-verification gates), so scraping
// them would mean defeating an access control. This dataset is published for
// reuse under the MIT licence — legal, keyless, and no rate limits.
//
// CSV columns: handle, title, imageName, series   (series is ';'-separated)
// Mapped to funko_items: id, title, number, category, series[], exclusive, image_name

export const DATASET_URL =
  'https://raw.githubusercontent.com/kennymkchan/funko-pop-data/master/funko_pop.csv';

/** How many rows we upsert per SQL statement (keeps us well under PG's param cap). */
const CHUNK_SIZE = 500;

/**
 * Series lines that signal exclusivity rather than a Funko line: retailer/
 * convention exclusives plus Chase variants. Used both to flag `exclusive` and
 * to skip these tags when picking a display category.
 */
// Leading word boundary only (no trailing) so plurals like "Exclusives" and
// "Chase Pieces" still match, mirroring the original /\bexclusive/i behaviour.
export const EXCLUSIVE_RE =
  /\b(exclusive|chase|sdcc|nycc|eccc|comic[\s-]?con|convention|specialty series|funko[\s-]?shop|shared sticker)/i;

/**
 * Map one parsed CSV row to a funko_items record. The dataset has no Pop number,
 * so `number` is left blank. `category` prefers the actual "Pop!" line (the
 * dataset often lists rarity/exclusivity tags like "Chase Pieces" first), then
 * the first line that isn't purely an exclusivity tag, then the first line.
 * `exclusive` is true when any series line matches EXCLUSIVE_RE.
 */
export function toItem(row) {
  const series = (row.series || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  const category =
    series.find((s) => /^pop!/i.test(s)) ||
    series.find((s) => !EXCLUSIVE_RE.test(s)) ||
    series[0] ||
    'Unknown';

  return {
    id: (row.handle || '').trim(),
    title: (row.title || '').trim(),
    number: '', // not present in this dataset
    category,
    series,
    exclusive: series.some((s) => EXCLUSIVE_RE.test(s)),
    imageName: (row.imageName || '').trim() || null,
  };
}

/** Download the dataset, parse it, and upsert every row into funko_items. */
export async function importFunkoDataset(pool, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(DATASET_URL);
  if (!res.ok) {
    throw new Error(`Dataset download failed: HTTP ${res.status}`);
  }
  const csv = await res.text();
  const items = parseFunkoCsv(csv).map(toItem).filter((it) => it.id && it.title);

  // The same handle can appear twice in the dataset; a single INSERT can't touch
  // the same conflict key twice, so keep the last occurrence per id.
  const byId = new Map(items.map((it) => [it.id, it]));
  const deduped = [...byId.values()];

  let upserted = 0;
  for (let i = 0; i < deduped.length; i += CHUNK_SIZE) {
    const chunk = deduped.slice(i, i + CHUNK_SIZE);
    upserted += await upsertChunk(pool, chunk);
  }

  return { total: items.length, unique: deduped.length, upserted };
}

/** Multi-row INSERT ... ON CONFLICT for one chunk. Returns rows affected. */
async function upsertChunk(pool, chunk) {
  const cols = 7; // id, title, number, category, series, exclusive, image_name
  const valuesSql = chunk
    .map((_, r) => {
      const o = r * cols;
      return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6}, $${o + 7})`;
    })
    .join(', ');

  const params = chunk.flatMap((it) => [
    it.id,
    it.title,
    it.number,
    it.category,
    JSON.stringify(it.series),
    it.exclusive,
    it.imageName,
  ]);

  const result = await pool.query(
    `INSERT INTO funko_items (id, title, number, category, series, exclusive, image_name)
     VALUES ${valuesSql}
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       number = EXCLUDED.number,
       category = EXCLUDED.category,
       series = EXCLUDED.series,
       exclusive = EXCLUDED.exclusive,
       image_name = EXCLUDED.image_name`,
    params,
  );
  return result.rowCount ?? chunk.length;
}

/**
 * Minimal RFC-4180 CSV parser: handles quoted fields, escaped quotes (""), and
 * embedded commas/newlines. Returns an array of objects keyed by the header row.
 */
export function parseFunkoCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const obj = {};
    header.forEach((key, idx) => {
      obj[key] = cells[idx] ?? '';
    });
    return obj;
  });
}
