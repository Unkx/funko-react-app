const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Use global fetch when available (Node 18+). If not available, the user
// should run with a newer Node or provide a global fetch polyfill.
const fetch = globalThis.fetch;

// PlantUML encoder implemented locally to avoid external dependency.
function encodePlantUml(text) {
  // deflate (raw)
  const deflated = zlib.deflateRawSync(Buffer.from(text, 'utf8'));
  return encode64(deflated);
}

function encode6bit(b) {
  if (b < 10) return String.fromCharCode(48 + b);
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function append3bytes(b1, b2, b3) {
  const c1 = (b1 >> 2) & 0x3F;
  const c2 = ((b1 & 0x3) << 4) | ((b2 >> 4) & 0xF);
  const c3 = ((b2 & 0xF) << 2) | ((b3 >> 6) & 0x3);
  const c4 = b3 & 0x3F;
  return encode6bit(c1) + encode6bit(c2) + encode6bit(c3) + encode6bit(c4);
}

function encode64(data) {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data[i], data[i + 1], 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data[i], 0, 0);
    } else {
      r += append3bytes(data[i], data[i + 1], data[i + 2]);
    }
  }
  return r;
}

(async () => {
  const repoRoot = path.resolve(__dirname, '..');
  const diagramsDir = path.join(repoRoot, 'diagrams');
  if (!fs.existsSync(diagramsDir)) {
    console.error('diagrams folder not found');
    process.exit(1);
  }

  const files = fs.readdirSync(diagramsDir).filter(f => f.endsWith('.puml'));
  if (files.length === 0) {
    console.log('No .puml files found in diagrams/');
    return;
  }

  for (const file of files) {
    const full = path.join(diagramsDir, file);
    const puml = fs.readFileSync(full, 'utf8');
    const encoded = encoder.encode(puml);
    const url = `https://www.plantuml.com/plantuml/png/${encoded}`;
    console.log('Rendering', file, '->', url);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const buffer = await res.arrayBuffer();
      const outFile = path.join(diagramsDir, file.replace(/\.puml$/, '.png'));
      fs.writeFileSync(outFile, Buffer.from(buffer));
      console.log('Wrote', outFile);
    } catch (err) {
      console.error('Failed to render', file, err.message || err);
    }
  }
})();
