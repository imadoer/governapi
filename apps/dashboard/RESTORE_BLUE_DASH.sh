#!/bin/bash
echo "🔄 Restoring Blue Dash (Dashboard with Sidebar)..."

# Find the latest backup
LATEST_BACKUP=$(ls -t src/app/dashboard/page.tsx.BLUE_DASH_WITH_SIDEBAR_* | head -1)

if [ -f "$LATEST_BACKUP" ]; then
    cp "$LATEST_BACKUP" src/app/dashboard/page.tsx
    echo "✅ Blue Dash restored from: $LATEST_BACKUP"
    echo "🔄 Restart your dev server to see changes"
else
    echo "❌ No Blue Dash backup found!"
fi
