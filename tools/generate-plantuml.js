const { Project } = require('ts-morph');
const fs = require('fs');
const path = require('path');

// Paths
const repoRoot = path.resolve(__dirname, '..');
const srcDir = path.join(repoRoot, 'src');
const outDir = path.join(repoRoot, 'diagrams');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const project = new Project({
  tsConfigFilePath: path.join(repoRoot, 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
});
project.addSourceFilesAtPaths(path.join(srcDir, '**/*.{ts,tsx,js,jsx}'));

const files = {};
const relations = [];

project.getSourceFiles().forEach((sf) => {
  const relPath = path.relative(srcDir, sf.getFilePath()).replace(/\\/g, '/');
  files[relPath] = { id: `F${Object.keys(files).length + 1}`, path: relPath };

  // collect imports to other local modules
  sf.getImportDeclarations().forEach((imp) => {
    const spec = imp.getModuleSpecifierValue();
    if (spec.startsWith('.') || spec.startsWith('/')) {
      // resolve to src relative path if possible
      try {
        const abs = path.resolve(path.dirname(sf.getFilePath()), spec);
        // try with extensions
        const candidates = [`${abs}.ts`, `${abs}.tsx`, `${abs}.js`, `${abs}.jsx`, path.join(abs, 'index.ts'), path.join(abs, 'index.tsx')];
        const found = candidates.find((c) => fs.existsSync(c));
        if (found) {
          const rel = path.relative(srcDir, found).replace(/\\/g, '/');
          relations.push({ from: relPath, to: rel });
        }
      } catch (e) {
        // ignore
      }
    }
  });
});

// Build PlantUML
let puml = '@startuml\nskinparam packageStyle rectangle\n\n';
Object.keys(files).forEach((f) => {
  puml += `package "${f}" as ${files[f].id}\nendpackage\n`;
});

relations.forEach((r) => {
  const fromId = files[r.from] && files[r.from].id;
  const toId = files[r.to] && files[r.to].id;
  if (fromId && toId && fromId !== toId) {
    puml += `${fromId} --> ${toId}\n`;
  }
});

puml += '\n@enduml\n';

const outFile = path.join(outDir, 'auto.puml');
fs.writeFileSync(outFile, puml, 'utf8');
console.log('Wrote', outFile);
