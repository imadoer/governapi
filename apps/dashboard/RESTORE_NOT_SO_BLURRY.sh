#!/bin/bash
echo "=== RESTORING 'NOT SO BLURRY' STATE ==="

# Find latest backup
LATEST=$(ls -t src/app/dashboard/page.tsx.NOT_SO_BLURRY_* | head -1)
LATEST_CSS=$(ls -t src/app/globals.css.NOT_SO_BLURRY_* | head -1)
LATEST_ADV=$(ls -td src/app/dashboard/components/advanced.NOT_SO_BLURRY_* | head -1)

# Restore
cp "$LATEST" src/app/dashboard/page.tsx
cp "$LATEST_CSS" src/app/globals.css
rm -rf src/app/dashboard/components/advanced
cp -r "$LATEST_ADV" src/app/dashboard/components/advanced

echo "✅ Restored 'NOT SO BLURRY' state!"
echo "Restart: pkill -f 'next dev' && npm run dev"
