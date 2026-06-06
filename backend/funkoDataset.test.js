import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFunkoCsv, importFunkoDataset, toItem } from './funkoDataset.js';

// Mirrors the real dataset shape, plus edge cases: a quoted title containing a
// comma, a multi-series row, an exclusive, and a duplicate handle.
const CSV = [
  'handle,title,imageName,series',
  'black-panther,Black Panther,https://img/bp.jpg,Pop! Tees & Apparel;Funko Target Exclusives',
  'pam-beesly,Pam Beesly,https://img/pam.jpg,Pop! Pins',
  'comma-guy,"Doctor Strange, Sorcerer Supreme",https://img/ds.jpg,Pop! Marvel',
  'pam-beesly,Pam Beesly (variant),https://img/pam2.jpg,Pop! Pins',
].join('\n');

test('parseFunkoCsv keys rows by header and handles quoted commas', () => {
  const rows = parseFunkoCsv(CSV);
  assert.equal(rows.length, 4);
  assert.equal(rows[2].handle, 'comma-guy');
  assert.equal(rows[2].title, 'Doctor Strange, Sorcerer Supreme');
});

test('toItem prefers the Pop! line for category and flags exclusivity', () => {
  // "Chase Pieces" is listed first but isn't a Funko line; category should be
  // the Pop! entry, and the Chase tag should still mark the item exclusive.
  const chase = toItem({ handle: 'prison-mike', title: 'Prison Mike', series: 'Chase Pieces;Pop! Pins' });
  assert.equal(chase.category, 'Pop! Pins');
  assert.equal(chase.exclusive, true);

  // A plain item with no exclusivity tags keeps its single series as category.
  const plain = toItem({ handle: 'jim-halpert', title: 'Jim Halpert', series: 'Pop! Television' });
  assert.equal(plain.category, 'Pop! Television');
  assert.equal(plain.exclusive, false);

  // Store/convention exclusives are detected even without the word "exclusive".
  assert.equal(toItem({ handle: 'a', title: 'A', series: 'Pop! Marvel;SDCC' }).exclusive, true);
});

test('importFunkoDataset maps, dedupes and upserts', async () => {
  const queries = [];
  const pool = {
    query: async (sql, params) => {
      queries.push({ sql, params });
      return { rowCount: params.length / 7 };
    },
  };
  const fetchImpl = async () => ({ ok: true, status: 200, text: async () => CSV });

  const result = await importFunkoDataset(pool, { fetchImpl });

  // 4 rows in, but the duplicate "pam-beesly" collapses to 3 unique.
  assert.equal(result.total, 4);
  assert.equal(result.unique, 3);
  assert.equal(queries.length, 1); // one chunk

  // Verify the mapping for the first record (id, title, number, category, series, exclusive, image).
  const p = queries[0].params;
  assert.equal(p[0], 'black-panther'); // id <- handle
  assert.equal(p[2], ''); // number blank (not in dataset)
  assert.equal(p[3], 'Pop! Tees & Apparel'); // category <- first series
  assert.equal(p[4], JSON.stringify(['Pop! Tees & Apparel', 'Funko Target Exclusives']));
  assert.equal(p[5], true); // exclusive inferred from series text
});

test('importFunkoDataset throws on a failed download', async () => {
  const pool = { query: async () => ({ rowCount: 0 }) };
  const fetchImpl = async () => ({ ok: false, status: 503, text: async () => '' });
  await assert.rejects(() => importFunkoDataset(pool, { fetchImpl }), /HTTP 503/);
});
