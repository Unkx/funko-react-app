#!/bin/bash

echo "🔧 Fixing mobile display issues..."

# Backup files
echo "📦 Creating backups..."
cp src/App.jsx src/App.jsx.backup
cp src/App.css src/App.css.backup
cp src/WelcomeSite.tsx src/WelcomeSite.tsx.backup 2>/dev/null || true

# Fix App.css - add mobile fixes
echo "✅ Adding global CSS fixes..."
cat > /tmp/mobile-fix.css << 'EOF'

/* Universal Mobile Fixes */
* {
  box-sizing: border-box;
}

html, body, #root {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

img, video, canvas, svg, iframe {
  max-width: 100%;
  height: auto;
}

p, h1, h2, h3, h4, h5, h6, span, div {
  word-wrap: break-word;
  overflow-wrap: break-word;
}
EOF

# Append to App.css if not already there
if ! grep -q "Universal Mobile Fixes" src/App.css; then
  cat /tmp/mobile-fix.css >> src/App.css
  echo "✅ Added mobile CSS to App.css"
fi

# Fix App.jsx - wrap in mobile-responsive div
if ! grep -q "overflow-x-hidden" src/App.jsx; then
  echo "✅ Fixing App.jsx..."
  sed -i 's/<BrowserRouter>/<BrowserRouter>\n      <div className="w-full max-w-full overflow-x-hidden min-h-screen">/g' src/App.jsx
  sed -i 's/<\/BrowserRouter>/      <\/div>\n    <\/BrowserRouter>/g' src/App.jsx
fi

# Fix all component files
echo "✅ Fixing component files..."
find src -name "*.tsx" -o -name "*.jsx" | while read file; do
  # Add mobile classes to root divs with min-h-screen
  sed -i 's/className="\([^"]*\)min-h-screen/className="\1w-full max-w-full overflow-x-hidden min-h-screen/g' "$file"
  
  # Make grids responsive
  sed -i 's/grid-cols-3 /grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 /g' "$file"
  sed -i 's/grid-cols-4 /grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 /g' "$file"
  
  # Make text responsive
  sed -i 's/text-3xl"/text-2xl sm:text-3xl lg:text-4xl"/g' "$file"
  sed -i 's/text-2xl"/text-xl sm:text-2xl"/g' "$file"
  
  # Fix headers
  sed -i 's/<header className="\([^"]*\)"/<header className="\1 w-full max-w-full overflow-x-hidden"/g' "$file"
done

echo "✅ Done! Files fixed:"
echo "   - src/App.css"
echo "   - src/App.jsx"
echo "   - All .tsx and .jsx files in src/"

echo ""
echo "🔄 Rebuilding..."
npm run build 2>/dev/null || yarn build 2>/dev/null || echo "⚠️  Please run 'npm run build' manually"

echo ""
echo "🎉 Mobile fixes applied!"
echo ""
echo "📱 To test on your phone:"
echo "   1. Run: npm run dev"
echo "   2. Find your IP: hostname -I"
echo "   3. On phone, open: http://YOUR-IP:5173"
