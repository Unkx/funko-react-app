# Diagrams

This folder contains sample PlantUML diagrams and an auto-generated `auto.puml` that can be created from the `src/` codebase.

Requirements
- Node.js (to run the generator script)
- `ts-morph` and `madge` are added as devDependencies; run `npm install` to install them.
- For PlantUML preview in VS Code, install the *PlantUML* extension and (optionally) Graphviz to render to images.

Commands

- Generate `diagrams/auto.puml` from your `src/` files:

```powershell
npm run generate:diagrams
```

- Generate a module dependency image (requires `madge`):

```powershell
npm run generate:deps
```

- Render all `.puml` files to PNG using the PlantUML public server:

```powershell
npm run render:diagrams
```

This will create `diagrams/*.png` next to each `.puml` file. The script uses `plantuml-encoder` and fetches images from `https://www.plantuml.com/plantuml/png/`.

Preview
- Use the PlantUML VS Code extension to open any `.puml` file and preview/export to PNG/SVG.

Notes
- `tools/generate-plantuml.js` does a best-effort mapping of local imports to files under `src/` and emits a PlantUML package graph. It is intentionally simple — you can extend it to include class names and members using `ts-morph` analysis.
