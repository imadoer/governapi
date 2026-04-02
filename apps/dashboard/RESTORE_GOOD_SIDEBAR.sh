#!/bin/bash
echo "=== RESTORING GOOD SIDEBAR STATE ==="

LATEST_DASH=$(ls -t src/app/dashboard/page.tsx.GOOD_SIDEBAR_* | head -1)
LATEST_ADV=$(ls -td src/app/dashboard/components/advanced.GOOD_SIDEBAR_* | head -1)

cp "$LATEST_DASH" src/app/dashboard/page.tsx
rm -rf src/app/dashboard/components/advanced
cp -r "$LATEST_ADV" src/app/dashboard/components/advanced

echo "✅ Restored good sidebar state!"
echo "Restart: pkill -f 'next dev' && npm run dev"
