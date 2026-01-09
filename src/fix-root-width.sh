#!/bin/bash

echo "🔧 Fixing #root width issue..."

# Backup
cp src/App.css src/App.css.backup

# Fix the #root rule
cat > /tmp/new-root.css << 'EOF'
#root {
  width: 100%;
  max-width: 100vw;
  margin: 0 auto;
  padding: 1rem;
  text-align: center;
  overflow-x: hidden;
}

@media (min-width: 1024px) {
  #root {
    max-width: 1280px;
    padding: 2rem;
  }
}
EOF

# Replace the #root section (lines 2-6)
sed -i '2,6d' src/App.css
sed -i '1r /tmp/new-root.css' src/App.css

echo "✅ Fixed! #root now responsive"
echo ""
echo "Test it:"
echo "  npm run dev"
